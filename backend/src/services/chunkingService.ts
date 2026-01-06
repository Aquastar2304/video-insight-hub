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

// Enhanced semantic chunking with topic modeling
export const chunkTranscript = async (
  transcript: Transcript,
  videoId: string
): Promise<Segment[]> => {
  const { text, wordTimestamps } = transcript;

  // Step 1: Use LLM to identify topic boundaries
  const topicBoundaries = await identifyTopicBoundaries(text);

  // Step 2: Create segments based on identified boundaries
  const segments: Segment[] = [];
  
  for (let i = 0; i < topicBoundaries.length; i++) {
    const boundary = topicBoundaries[i];
    const nextBoundary = topicBoundaries[i + 1];
    
    const startTime = getTimeForTextPosition(text, boundary.startIndex, wordTimestamps);
    const endTime = nextBoundary 
      ? getTimeForTextPosition(text, nextBoundary.startIndex, wordTimestamps)
      : getTimeForTextPosition(text, text.length, wordTimestamps);
    
    const segmentText = text.substring(boundary.startIndex, nextBoundary?.startIndex || text.length).trim();
    
    if (segmentText.length < 50) {
      // Skip very short segments
      continue;
    }

    // Generate title and description
    const { title, description } = await generateChapterInfo(segmentText);
    
    const segmentId = uuidv4();
    const segment: Segment = {
      id: segmentId,
      video_id: videoId,
      start_time: startTime,
      end_time: endTime,
      title,
      description,
      segment_text: segmentText,
      order_index: segments.length,
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

// Identify topic boundaries using LLM
interface TopicBoundary {
  startIndex: number;
  topic: string;
}

const identifyTopicBoundaries = async (text: string): Promise<TopicBoundary[]> => {
  try {
    // Split text into chunks for analysis (LLM context limits)
    const chunkSize = 8000;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    const allBoundaries: TopicBoundary[] = [{ startIndex: 0, topic: 'Introduction' }];
    let currentOffset = 0;

    for (const chunk of chunks) {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a video transcript to identify where topics change. 
Return a JSON array of objects with "position" (character index within this chunk) and "topic" (brief topic name).
Only identify major topic shifts, not minor transitions. Aim for 3-8 topics per chunk.`,
          },
          {
            role: 'user',
            content: `Identify topic boundaries in this transcript chunk:\n\n${chunk}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const boundaries = parsed.boundaries || parsed.topics || [];

      // Convert relative positions to absolute positions
      boundaries.forEach((boundary: any) => {
        const absolutePosition = currentOffset + (boundary.position || boundary.index || 0);
        if (absolutePosition > 0 && absolutePosition < text.length) {
          allBoundaries.push({
            startIndex: absolutePosition,
            topic: boundary.topic || 'Topic',
          });
        }
      });

      currentOffset += chunk.length;
    }

    // Sort by position and remove duplicates
    allBoundaries.sort((a, b) => a.startIndex - b.startIndex);
    const unique: TopicBoundary[] = [];
    let lastIndex = -1;
    
    for (const boundary of allBoundaries) {
      if (boundary.startIndex > lastIndex + 200) { // At least 200 chars apart
        unique.push(boundary);
        lastIndex = boundary.startIndex;
      }
    }

    return unique.length > 0 ? unique : [{ startIndex: 0, topic: 'Main Content' }];
  } catch (error) {
    console.error('Error identifying topic boundaries:', error);
    // Fallback to time-based chunking
    return fallbackChunking(text);
  }
};

// Fallback chunking method (time-based)
const fallbackChunking = (text: string): TopicBoundary[] => {
  const boundaries: TopicBoundary[] = [{ startIndex: 0, topic: 'Introduction' }];
  const targetChunkSize = 2000; // characters
  
  for (let i = targetChunkSize; i < text.length; i += targetChunkSize) {
    // Find sentence boundary near target position
    const searchStart = Math.max(0, i - 200);
    const searchEnd = Math.min(text.length, i + 200);
    const searchText = text.substring(searchStart, searchEnd);
    
    const sentenceEnd = searchText.search(/[.!?]\s+/);
    if (sentenceEnd > 0) {
      boundaries.push({
        startIndex: searchStart + sentenceEnd + 1,
        topic: 'Topic',
      });
    } else {
      boundaries.push({
        startIndex: i,
        topic: 'Topic',
      });
    }
  }
  
  return boundaries;
};

// Get timestamp for a text position
const getTimeForTextPosition = (
  fullText: string,
  position: number,
  wordTimestamps: any[]
): number => {
  if (!wordTimestamps || wordTimestamps.length === 0) {
    // Estimate: ~150 words per minute = 0.4 seconds per word
    const wordsBefore = fullText.substring(0, position).split(/\s+/).length;
    return wordsBefore * 0.4;
  }

  // Find the word that contains this position
  let charCount = 0;
  for (const word of wordTimestamps) {
    const wordLength = word.word?.length || 0;
    if (charCount + wordLength >= position) {
      return word.start || 0;
    }
    charCount += wordLength + 1; // +1 for space
  }

  // Fallback to last timestamp
  const lastWord = wordTimestamps[wordTimestamps.length - 1];
  return lastWord?.start || 0;
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
          content: `Given this transcript segment, create:
1. A short, descriptive title (3-8 words)
2. A one-sentence description (max 150 characters)

Return as JSON: {"title": "...", "description": "..."}

Transcript:\n${text.substring(0, 1500)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    return {
      title: parsed.title || text.split(/\s+/).slice(0, 6).join(' ') + '...',
      description: parsed.description || text.substring(0, 150) + '...',
    };
  } catch (error) {
    console.error('Error generating chapter info:', error);
    // Fallback
    const words = text.split(/\s+/).slice(0, 5).join(' ');
    return {
      title: words + '...',
      description: text.substring(0, 150) + '...',
    };
  }
};
