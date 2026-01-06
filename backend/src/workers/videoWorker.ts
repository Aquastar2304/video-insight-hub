import videoQueue from '../queue/videoQueue';
import { processVideo } from '../services/videoProcessingService';

// Process video jobs
videoQueue.process(async (job) => {
  const { videoId } = job.data;
  
  console.log(`🔄 Processing video: ${videoId}`);
  
  try {
    // Update progress
    await job.progress(10);
    
    // Process video (transcription, chunking, insights, embeddings)
    await processVideo(videoId, (progress: number) => {
      job.progress(progress);
    });
    
    console.log(`✅ Video processing completed: ${videoId}`);
    return { success: true, videoId };
  } catch (error: any) {
    console.error(`❌ Video processing failed: ${videoId}`, error);
    throw error;
  }
});

console.log('👷 Video worker started and listening for jobs...');

