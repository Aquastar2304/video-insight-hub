import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { query } from '../config/database';
import { updateVideoStatus } from './videoService';
import { generateEmbedding } from './embeddingService';
import { extractInsights } from './insightService';
import { chunkTranscript } from './chunkingService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProgressCallback {
  (progress: number, stage: string): void;
}

export const processVideo = async (
  videoId: string,
  onProgress?: ProgressCallback
): Promise<void> => {
  try {
    // Get video record
    const videoResult = await query('SELECT * FROM videos WHERE id = $1', [videoId]);
    if (videoResult.rows.length === 0) {
      throw new Error('Video not found');
    }

    const video = videoResult.rows[0];
    await updateVideoStatus(videoId, 'processing');
    onProgress?.(10, 'processing');

    // Step 1: Extract audio (20% progress)
    onProgress?.(15, 'extracting_audio');
    const audioPath = await extractAudio(video.storage_url, videoId);
    onProgress?.(20, 'audio_extracted');

    // Step 2: Transcribe audio (40% progress)
    onProgress?.(25, 'transcribing');
    const transcript = await transcribeAudio(audioPath, videoId);
    onProgress?.(40, 'transcription_complete');

    // Step 3: Chunk transcript into segments (60% progress)
    onProgress?.(45, 'chunking');
    const segments = await chunkTranscript(transcript, videoId);
    onProgress?.(60, 'chunking_complete');

    // Step 4: Extract insights and generate embeddings (80% progress)
    onProgress?.(65, 'extracting_insights');
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Extract insights
      await extractInsights(segment.id, segment.segment_text);
      
      // Generate embedding
      await generateEmbedding(segment.id, segment.segment_text);
      
      const progress = 65 + Math.floor(((i + 1) / segments.length) * 20);
      onProgress?.(progress, `processing_segment_${i + 1}_of_${segments.length}`);
    }

    // Step 5: Mark as completed (100% progress)
    onProgress?.(95, 'finalizing');
    await updateVideoStatus(videoId, 'completed');
    onProgress?.(100, 'completed');

    // Cleanup temporary audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  } catch (error: any) {
    await updateVideoStatus(videoId, 'failed', error.message);
    throw error;
  }
};

// Extract audio from video
const extractAudio = async (videoPath: string, videoId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      process.env.UPLOAD_DIR || './uploads',
      'temp',
      `${videoId}.wav`
    );

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // For local storage, videoPath might be relative
    const fullVideoPath = videoPath.startsWith('/') 
      ? videoPath 
      : path.join(process.env.UPLOAD_DIR || './uploads', videoPath);

    ffmpeg(fullVideoPath)
      .output(outputPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

// Transcribe audio using OpenAI Whisper
const transcribeAudio = async (audioPath: string, videoId: string): Promise<{ text: string; wordTimestamps: any[] }> => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath) as any,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    // Store transcript in database
    const existingTranscript = await query('SELECT id FROM transcripts WHERE video_id = $1', [videoId]);
    
    if (existingTranscript.rows.length === 0) {
      await query(
        `INSERT INTO transcripts (video_id, full_text, word_timestamps, confidence_score, language)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          videoId,
          transcription.text,
          JSON.stringify(transcription.words || []),
          null, // Whisper doesn't provide confidence scores
          transcription.language || 'en',
        ]
      );
    } else {
      // Update existing transcript
      await query(
        `UPDATE transcripts SET full_text = $1, word_timestamps = $2, language = $3 WHERE video_id = $4`,
        [
          transcription.text,
          JSON.stringify(transcription.words || []),
          transcription.language || 'en',
          videoId,
        ]
      );
    }

    return {
      text: transcription.text,
      wordTimestamps: transcription.words || [],
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

