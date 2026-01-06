import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSegmentInsights, getSegmentById } from '../services/segmentService';
import { getVideoById } from '../services/videoService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get insights for a segment
router.get('/:segmentId/insights', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { segmentId } = req.params;

    const segment = await getSegmentById(segmentId);
    if (!segment) {
      throw new AppError('Segment not found', 404);
    }

    // Verify video belongs to user
    const video = await getVideoById(segment.video_id, req.userId!);
    if (!video) {
      throw new AppError('Video not found', 404);
    }

    const insights = await getSegmentInsights(segmentId);

    res.json({ insights });
  } catch (error) {
    next(error);
  }
});

export default router;

