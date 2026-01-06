import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { createVideo, getUserVideos, getVideoById, deleteVideo, updateVideoStatus } from '../services/videoService';
import { getStorageService } from '../config/storage';
import { AppError } from '../middleware/errorHandler';
import { getJobStatus } from '../queue/videoQueue';
import { getVideoSegments, getSegmentInsights } from '../services/segmentService';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads/temp');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '4294967296'), // 4GB default
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only video files are allowed.', 400));
    }
  },
});

// Validation schemas
const submitUrlSchema = z.object({
  body: z.object({
    url: z.string().url('Invalid URL'),
    title: z.string().optional(),
  }),
});

// Upload video file
router.post(
  '/upload',
  authenticate,
  upload.single('video'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const userId = req.userId!;
      const title = req.body.title || req.file.originalname;
      const storageService = getStorageService();

      // Upload to storage (S3 or local)
      const storageKey = `videos/${userId}/${req.file.filename}`;
      const storageUrl = await storageService.uploadFile(req.file.path, storageKey);

      // Create video record
      const video = await createVideo({
        userId,
        title,
        storageUrl,
      });

      res.status(201).json({
        video,
        message: 'Video uploaded successfully. Processing will begin shortly.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Submit video by URL
router.post(
  '/submit-url',
  authenticate,
  validate(submitUrlSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { url, title } = req.body;

      // For now, just store the URL. Actual downloading will happen in the worker
      const storageService = getStorageService();
      const storageKey = `videos/${userId}/${uuidv4()}.url`;
      
      // Create a placeholder - actual video will be downloaded by worker
      const video = await createVideo({
        userId,
        title: title || 'Video from URL',
        originalUrl: url,
        storageUrl: storageKey, // Placeholder
      });

      res.status(201).json({
        video,
        message: 'Video URL submitted. Processing will begin shortly.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all videos for user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    const { videos, total } = await getUserVideos(userId, limit, offset, status);

    res.json({
      videos,
      pagination: {
        limit,
        offset,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get video by ID
router.get('/:videoId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    const video = await getVideoById(videoId, userId);

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    // Get processing status if available
    const jobStatus = await getJobStatus(videoId);

    res.json({
      video,
      processing: jobStatus ? {
        status: jobStatus.status,
        progress: jobStatus.progress,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

// Get video segments (chapters)
router.get('/:videoId/segments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    // Verify video belongs to user
    const video = await getVideoById(videoId, userId);
    if (!video) {
      throw new AppError('Video not found', 404);
    }

    const segments = await getVideoSegments(videoId);

    res.json({ segments });
  } catch (error) {
    next(error);
  }
});

// Get video status
router.get('/:videoId/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    const video = await getVideoById(videoId, userId);

    if (!video) {
      throw new AppError('Video not found', 404);
    }

    const jobStatus = await getJobStatus(videoId);

    res.json({
      status: video.status,
      progress: jobStatus?.progress || 0,
      currentStage: jobStatus?.status || 'pending',
      error: video.error_message,
    });
  } catch (error) {
    next(error);
  }
});

// Delete video
router.delete('/:videoId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    await deleteVideo(videoId, userId);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
