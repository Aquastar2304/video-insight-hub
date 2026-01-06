import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Transcript {
  text: string;
  wordTimestamps: any[];
}

interface Segment {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  title: string;
  description: string;
  segment_text: string;
  order_index: number;
}

// Simple chunking: split by sentences and create segments every ~5 minutes
export const chunkTranscript = async (
  transcript: Transcript,
  videoId: string
): Promise<Segment[]> => {
  const { text, wordTimestamps } = transcript;

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Group sentences into chunks (target: ~5 minutes or 300 seconds)
  const targetChunkDuration = 300; // 5 minutes
  const chunks: { text: string; startTime: number; endTime: number }[] = [];
  
  let currentChunk = '';
  let currentStartTime = 0;
  let currentEndTime = 0;
  let sentenceIndex = 0;

  for (const sentence of sentences) {
    // Estimate time for this sentence (rough approximation)
    const wordCount = sentence.split(/\s+/).length;
    const estimatedDuration = wordCount * 0.5; // ~0.5 seconds per word
    
    if (currentChunk && (currentEndTime - currentStartTime + estimatedDuration) > targetChunkDuration) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        startTime: currentStartTime,
        endTime: currentEndTime,
      });
      
      // Start new chunk
      currentChunk = sentence;
      currentStartTime = currentEndTime;
      currentEndTime = currentStartTime + estimatedDuration;
    } else {
      // Add to current chunk
      currentChunk += ' ' + sentence;
      if (currentStartTime === 0) {
        // Try to get actual start time from word timestamps
        const firstWord = wordTimestamps.find((w: any) => 
          text.indexOf(sentence) >= (w.start || 0)
        );
        currentStartTime = firstWord?.start || 0;
      }
      currentEndTime += estimatedDuration;
    }
    sentenceIndex++;
  }

  // Add final chunk
  if (currentChunk) {
    chunks.push({
      text: currentChunk.trim(),
      startTime: currentStartTime,
      endTime: currentEndTime,
    });
  }

  // Generate titles and descriptions for each chunk using LLM
  const segments: Segment[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Generate title and description
    const { title, description } = await generateChapterInfo(chunk.text);
    
    const segmentId = uuidv4();
    const segment: Segment = {
      id: segmentId,
      video_id: videoId,
      start_time: chunk.startTime,
      end_time: chunk.endTime,
      title,
      description,
      segment_text: chunk.text,
      order_index: i,
    };

    // Save to database
    await query(
      `INSERT INTO segments (id, video_id, start_time, end_time, title, description, segment_text, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        segment.id,
        segment.video_id,
        segment.start_time,
        segment.end_time,
        segment.title,
        segment.description,
        segment.segment_text,
        segment.order_index,
      ]
    );

    segments.push(segment);
  }

  return segments;
};

// Generate chapter title and description using LLM
const generateChapterInfo = async (text: string): Promise<{ title: string; description: string }> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise chapter titles and descriptions for video transcripts.',
        },
        {
          role: 'user',
          content: `Given this transcript segment, create a short title (3-8 words) and a one-sentence description:\n\n${text.substring(0, 1000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || '';
    const lines = content.split('\n').filter(l => l.trim());
    
    const title = lines[0]?.replace(/^Title:\s*/i, '').trim() || 'Untitled Chapter';
    const description = lines[1]?.replace(/^Description:\s*/i, '').trim() || lines[0] || 'No description available';

    return { title, description };
  } catch (error) {
    console.error('Error generating chapter info:', error);
    // Fallback to simple title
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    return {
      title: words + '...',
      description: text.substring(0, 150) + '...',
    };
  }
};

