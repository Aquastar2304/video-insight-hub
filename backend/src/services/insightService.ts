import OpenAI from 'openai';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Insight {
  text: string;
  type: 'main_point' | 'definition' | 'example' | 'takeaway' | 'qa';
  timestamp?: number;
}

export const extractInsights = async (segmentId: string, segmentText: string): Promise<void> => {
  try {
    const insights = await generateInsights(segmentText);

    // Save insights to database
    for (let i = 0; i < insights.length; i++) {
      const insight = insights[i];
      await query(
        `INSERT INTO insights (id, segment_id, insight_text, insight_type, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), segmentId, insight.text, insight.type, i]
      );
    }
  } catch (error) {
    console.error('Error extracting insights:', error);
    // Don't throw - insights are optional
  }
};

const generateInsights = async (text: string): Promise<Insight[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts key insights from video transcripts.
Extract the following types of insights:
- main_point: The 2-4 most important ideas or arguments
- definition: Important terms, concepts, or principles explicitly defined
- example: Case studies, illustrations, or demonstrations
- takeaway: Practical advice, steps, or recommendations

Return ONLY a JSON array of insights, each with "text" and "type" fields. Limit to 5-8 insights total.`,
        },
        {
          role: 'user',
          content: `Extract insights from this transcript segment:\n\n${text.substring(0, 2000)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    // Handle both { insights: [...] } and direct array formats
    const insightsArray = parsed.insights || parsed || [];
    
    return insightsArray
      .slice(0, 8)
      .map((insight: any) => ({
        text: insight.text || insight.insight_text || '',
        type: insight.type || 'main_point',
      }))
      .filter((insight: Insight) => insight.text.length > 0);
  } catch (error) {
    console.error('Error generating insights:', error);
    // Return empty array on error
    return [];
  }
};

