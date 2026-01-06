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
      model: 'gpt-4', // Using GPT-4 for better insight extraction
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting key insights from educational video content.
Analyze the transcript segment and extract the following types of insights:

1. **main_point**: The 2-4 most important ideas, concepts, or arguments presented (required)
2. **definition**: Important terms, concepts, principles, or methodologies explicitly defined
3. **example**: Specific examples, case studies, demonstrations, or illustrations provided
4. **takeaway**: Practical advice, actionable steps, recommendations, or best practices
5. **qa**: Questions posed and their answers, or important Q&A discussions

Guidelines:
- Extract 5-10 insights total (prioritize quality over quantity)
- Each insight should be clear, concise, and self-contained
- Focus on information that would be valuable for someone reviewing the content
- Avoid redundant or overlapping insights
- If a type doesn't apply, omit it

Return a JSON object with an "insights" array. Each insight must have "text" and "type" fields.`,
        },
        {
          role: 'user',
          content: `Extract insights from this transcript segment:\n\n${text.substring(0, 3000)}`,
        },
      ],
      temperature: 0.2, // Lower temperature for more consistent extraction
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    
    // Handle both { insights: [...] } and direct array formats
    const insightsArray = parsed.insights || parsed || [];
    
    // Validate and clean insights
    const validInsights = insightsArray
      .map((insight: any) => {
        const text = insight.text || insight.insight_text || '';
        const type = insight.type || 'main_point';
        
        // Validate type
        const validTypes = ['main_point', 'definition', 'example', 'takeaway', 'qa'];
        const validType = validTypes.includes(type) ? type : 'main_point';
        
        return {
          text: text.trim(),
          type: validType,
        };
      })
      .filter((insight: Insight) => {
        // Filter out empty or too short insights
        return insight.text.length > 10 && insight.text.length < 500;
      })
      .slice(0, 10); // Limit to 10 insights

    // Ensure at least one main point
    if (validInsights.length === 0) {
      // Fallback: extract first sentence as main point
      const firstSentence = text.match(/[^.!?]+[.!?]+/)?.[0] || text.substring(0, 200);
      return [{
        text: firstSentence.trim(),
        type: 'main_point' as const,
      }];
    }

    return validInsights;
  } catch (error) {
    console.error('Error generating insights:', error);
    // Return empty array on error - insights are optional
    return [];
  }
};
