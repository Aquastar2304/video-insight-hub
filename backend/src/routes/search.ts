import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { semanticSearch } from '../services/searchService';

const router = Router();

// Validation schema
const searchSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Search query is required'),
    scope: z.enum(['video', 'library']).default('library'),
    videoId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
});

// Semantic search
router.post(
  '/',
  authenticate,
  validate(searchSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { query, scope, videoId, limit } = req.body;

      const results = await semanticSearch({
        userId,
        query,
        scope: scope as 'video' | 'library',
        videoId,
        limit,
      });

      res.json({
        results,
        query,
        count: results.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

