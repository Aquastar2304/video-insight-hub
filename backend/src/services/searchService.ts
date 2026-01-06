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
  minSimilarity?: number;
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
  const { 
    userId, 
    query: searchQuery, 
    scope, 
    videoId, 
    limit = 20,
    minSimilarity = 0.5 
  } = input;

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
      AND v.status = 'completed'
      AND (1 - (e.embedding <=> $1::vector)) > $3
  `;

  const params: any[] = [`[${queryEmbedding.join(',')}]`, userId, minSimilarity];

  // Filter by video if scope is 'video'
  if (scope === 'video' && videoId) {
    sqlQuery += ' AND v.id = $' + (params.length + 1);
    params.push(videoId);
  }

  // Order by similarity and limit results
  sqlQuery += `
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
    console.error('Search error:', error);
    throw new AppError('Search failed', 500);
  }
};

// Enhanced search with query expansion
export const enhancedSearch = async (input: SearchInput): Promise<SearchResult[]> => {
  // First, try to expand the query for better results
  const expandedQuery = await expandQuery(input.query);
  
  // Perform search with expanded query
  const results = await semanticSearch({
    ...input,
    query: expandedQuery,
  });

  return results;
};

// Expand search query using LLM to improve results
const expandQuery = async (query: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a search query optimizer. Expand the user\'s search query to include synonyms and related terms that would help find relevant content. Return only the expanded query, not an explanation.',
        },
        {
          role: 'user',
          content: `Expand this search query: "${query}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const expanded = response.choices[0]?.message?.content?.trim() || query;
    // Combine original and expanded for better coverage
    return `${query} ${expanded}`;
  } catch (error) {
    console.error('Query expansion error:', error);
    return query; // Return original if expansion fails
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
