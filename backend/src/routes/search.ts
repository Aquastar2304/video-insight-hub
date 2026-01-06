import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { semanticSearch, enhancedSearch } from '../services/searchService';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schema
const searchSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Search query is required'),
    scope: z.enum(['video', 'library']).default('library'),
    videoId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
    minSimilarity: z.number().min(0).max(1).optional().default(0.5),
    enhanced: z.boolean().optional().default(false),
  }),
});

// Semantic search
router.post(
  '/',
  authenticate,
  searchLimiter,
  validate(searchSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { query, scope, videoId, limit, minSimilarity, enhanced } = req.body;

      const searchFunction = enhanced ? enhancedSearch : semanticSearch;
      
      const results = await searchFunction({
        userId,
        query,
        scope: scope as 'video' | 'library',
        videoId,
        limit,
        minSimilarity,
      });

      res.json({
        results,
        query,
        count: results.length,
        enhanced: enhanced || false,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

