import { query } from '../config/database';

export interface Segment {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  title: string;
  description: string;
  segment_text: string;
  order_index: number;
}

export interface Insight {
  id: string;
  segment_id: string;
  insight_text: string;
  insight_type: 'main_point' | 'definition' | 'example' | 'takeaway' | 'qa';
  timestamp?: number;
  order_index: number;
}

export const getVideoSegments = async (videoId: string): Promise<Segment[]> => {
  const result = await query(
    `SELECT * FROM segments 
     WHERE video_id = $1 
     ORDER BY order_index ASC`,
    [videoId]
  );

  return result.rows as Segment[];
};

export const getSegmentInsights = async (segmentId: string): Promise<Insight[]> => {
  const result = await query(
    `SELECT * FROM insights 
     WHERE segment_id = $1 
     ORDER BY order_index ASC`,
    [segmentId]
  );

  return result.rows as Insight[];
};

export const getSegmentById = async (segmentId: string): Promise<Segment | null> => {
  const result = await query(
    'SELECT * FROM segments WHERE id = $1',
    [segmentId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as Segment;
};

