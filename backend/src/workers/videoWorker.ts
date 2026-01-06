import videoQueue from '../queue/videoQueue';
import { processVideo } from '../services/videoProcessingService';
import { getVideoById } from '../services/videoService';
import { emitVideoProgress, emitVideoComplete, emitVideoError } from '../config/socket';

// Process video jobs
videoQueue.process(async (job) => {
  const { videoId } = job.data;
  
  console.log(`🔄 Processing video: ${videoId}`);
  
  try {
    // Get video to get user ID for socket notifications
    const video = await getVideoById(videoId);
    const userId = video?.user_id;

    // Update progress
    await job.progress(10);
    if (userId) emitVideoProgress(userId, videoId, 10, 'starting');

    // Process video (transcription, chunking, insights, embeddings)
    await processVideo(videoId, (progress: number, stage: string) => {
      job.progress(progress);
      if (userId) emitVideoProgress(userId, videoId, progress, stage);
    });
    
    console.log(`✅ Video processing completed: ${videoId}`);
    if (userId) emitVideoComplete(userId, videoId);
    return { success: true, videoId };
  } catch (error: any) {
    console.error(`❌ Video processing failed: ${videoId}`, error);
    const video = await getVideoById(videoId);
    if (video?.user_id) {
      emitVideoError(video.user_id, videoId, error.message || 'Processing failed');
    }
    throw error;
  }
});

console.log('👷 Video worker started and listening for jobs...');

