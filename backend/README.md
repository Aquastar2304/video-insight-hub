# ClipMind Backend

Backend API server for ClipMind video knowledge extraction system.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ with pgvector extension
- Redis 6+
- FFmpeg (for audio extraction)
- OpenAI API key (for transcription, embeddings, and LLM)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

DATABASE_URL=postgresql://postgres:password@localhost:5432/clipmind
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=4294967296
UPLOAD_DIR=./uploads

USE_S3=false
# If using S3:
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=clipmind-videos
```

### 3. Database Setup

```bash
# Create database
createdb clipmind

# Install pgvector extension
# See: https://github.com/pgvector/pgvector

# Run migrations
npm run migrate
```

### 4. Start Services

**Start Redis:**
```bash
redis-server
```

**Start Backend Server:**
```bash
npm run dev
```

**Start Worker (in separate terminal):**
```bash
npm run dev:worker
# Or: ts-node src/workers/startWorker.ts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Videos
- `POST /api/videos/upload` - Upload video file
- `POST /api/videos/submit-url` - Submit video URL
- `GET /api/videos` - Get user's videos
- `GET /api/videos/:id` - Get video details
- `GET /api/videos/:id/status` - Get processing status
- `DELETE /api/videos/:id` - Delete video

### Search
- `POST /api/search` - Semantic search

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis, Storage config
│   ├── db/              # Database migrations and schema
│   ├── middleware/      # Auth, error handling, validation
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── queue/           # Job queue setup
│   ├── workers/         # Background workers
│   └── index.ts         # Server entry point
├── package.json
└── tsconfig.json
```

