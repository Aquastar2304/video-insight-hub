import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { getStorageService } from '../config/storage';
import { AppError } from '../middleware/errorHandler';
import { addVideoProcessingJob } from '../queue/videoQueue';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  original_url?: string;
  storage_url: string;
  duration_seconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: Date;
  processed_at?: Date;
}

export interface CreateVideoInput {
  userId: string;
  title: string;
  originalUrl?: string;
  storageUrl: string;
  durationSeconds?: number;
}

export const createVideo = async (input: CreateVideoInput): Promise<Video> => {
  const { userId, title, originalUrl, storageUrl, durationSeconds } = input;

  const result = await query(
    `INSERT INTO videos (id, user_id, title, original_url, storage_url, duration_seconds, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [uuidv4(), userId, title, originalUrl || null, storageUrl, durationSeconds || null, 'pending']
  );

  const video = result.rows[0] as Video;

  // Add to processing queue
  await addVideoProcessingJob(video.id);

  return video;
};

export const getVideoById = async (videoId: string, userId?: string): Promise<Video | null> => {
  let queryText = 'SELECT * FROM videos WHERE id = $1';
  const params: any[] = [videoId];

  if (userId) {
    queryText += ' AND user_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as Video;
};

export const getUserVideos = async (
  userId: string,
  limit: number = 20,
  offset: number = 0,
  status?: string
): Promise<{ videos: Video[]; total: number }> => {
  let queryText = 'SELECT * FROM videos WHERE user_id = $1';
  const params: any[] = [userId];

  if (status) {
    queryText += ' AND status = $2';
    params.push(status);
  }

  // Get total count
  const countResult = await query(
    queryText.replace('SELECT *', 'SELECT COUNT(*)'),
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get videos with pagination
  queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const result = await query(queryText, params);

  return {
    videos: result.rows as Video[],
    total,
  };
};

export const updateVideoStatus = async (
  videoId: string,
  status: Video['status'],
  errorMessage?: string
): Promise<void> => {
  const updateFields: string[] = ['status = $1'];
  const params: any[] = [status];

  if (status === 'completed') {
    updateFields.push('processed_at = CURRENT_TIMESTAMP');
  }

  if (errorMessage) {
    updateFields.push('error_message = $' + (params.length + 1));
    params.push(errorMessage);
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  await query(
    `UPDATE videos SET ${updateFields.join(', ')} WHERE id = $${params.length + 1}`,
    [...params, videoId]
  );
};

export const deleteVideo = async (videoId: string, userId: string): Promise<void> => {
  // Get video to check ownership and get storage URL
  const video = await getVideoById(videoId, userId);
  
  if (!video) {
    throw new AppError('Video not found', 404);
  }

  // Delete from storage
  const storageService = getStorageService();
  try {
    // Extract key from storage URL
    const key = video.storage_url.split('/').pop() || video.id;
    await storageService.deleteFile(key);
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database (cascade will handle related records)
  await query('DELETE FROM videos WHERE id = $1 AND user_id = $2', [videoId, userId]);
};

