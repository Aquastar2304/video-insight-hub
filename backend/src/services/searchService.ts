import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchInput {
  userId: string;
  query: string;
  scope: 'video' | 'library';
  videoId?: string;
  limit?: number;
}

interface SearchResult {
  segmentId: string;
  videoId: string;
  videoTitle: string;
  segmentTitle: string;
  segmentText: string;
  timestamp: number;
  similarity: number;
}

export const semanticSearch = async (input: SearchInput): Promise<SearchResult[]> => {
  const { userId, query: searchQuery, scope, videoId, limit = 20 } = input;

  // Generate embedding for search query
  const queryEmbedding = await generateEmbedding(searchQuery);

  // Build SQL query for vector similarity search
  let sqlQuery = `
    SELECT 
      s.id as segment_id,
      v.id as video_id,
      v.title as video_title,
      s.title as segment_title,
      s.segment_text,
      s.start_time as timestamp,
      1 - (e.embedding <=> $1::vector) as similarity
    FROM embeddings e
    JOIN segments s ON e.segment_id = s.id
    JOIN videos v ON s.video_id = v.id
    WHERE v.user_id = $2
  `;

  const params: any[] = [`[${queryEmbedding.join(',')}]`, userId];

  // Filter by video if scope is 'video'
  if (scope === 'video' && videoId) {
    sqlQuery += ' AND v.id = $' + (params.length + 1);
    params.push(videoId);
  }

  // Filter by similarity threshold and order by similarity
  sqlQuery += `
    AND (1 - (e.embedding <=> $1::vector)) > 0.5
    ORDER BY similarity DESC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  try {
    const result = await query(sqlQuery, params);

    return result.rows.map((row) => ({
      segmentId: row.segment_id,
      videoId: row.video_id,
      videoTitle: row.video_title,
      segmentTitle: row.segment_title,
      segmentText: row.segment_text,
      timestamp: parseFloat(row.timestamp),
      similarity: parseFloat(row.similarity),
    }));
  } catch (error: any) {
    // If embeddings table is empty or query fails, return empty results
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      return [];
    }
    throw new AppError('Search failed', 500);
  }
};

// Generate embedding for text using OpenAI
const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new AppError('Failed to generate search embedding', 500);
  }
};

