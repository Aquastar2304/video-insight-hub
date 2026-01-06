import OpenAI from 'openai';
import { query } from '../config/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (segmentId: string, text: string): Promise<void> => {
  try {
    // Generate embedding using OpenAI
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit text length
    });

    const embedding = response.data[0].embedding;

    // Store embedding in database
    await query(
      `INSERT INTO embeddings (segment_id, embedding, model_name)
       VALUES ($1, $2::vector, $3)
       ON CONFLICT (segment_id) DO UPDATE SET embedding = $2::vector, model_name = $3`,
      [segmentId, `[${embedding.join(',')}]`, 'text-embedding-ada-002']
    );
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Don't throw - embeddings are generated asynchronously
  }
};

