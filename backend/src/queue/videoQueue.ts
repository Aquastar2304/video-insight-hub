import Bull from 'bull';
import redisClient from '../config/redis';

export interface VideoJobData {
  videoId: string;
}

// Create video processing queue
export const videoQueue = new Bull<VideoJobData>('video-processing', {
  redis: {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':')[1] || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Add job to queue
export const addVideoProcessingJob = async (videoId: string) => {
  const job = await videoQueue.add({ videoId });
  console.log(`📥 Added video processing job: ${job.id} for video ${videoId}`);
  return job;
};

// Get job status
export const getJobStatus = async (videoId: string) => {
  const jobs = await videoQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
  const job = jobs.find(j => j.data.videoId === videoId);
  
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress(),
    data: job.data,
    result: job.returnvalue,
    error: job.failedReason,
  };
};

// Queue event handlers
videoQueue.on('completed', (job) => {
  console.log(`✅ Video processing completed: ${job.id}`);
});

videoQueue.on('failed', (job, err) => {
  console.error(`❌ Video processing failed: ${job.id}`, err);
});

videoQueue.on('stalled', (job) => {
  console.warn(`⚠️ Video processing stalled: ${job.id}`);
});

export default videoQueue;

