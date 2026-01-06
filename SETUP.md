# ClipMind Setup Guide

Complete setup instructions for ClipMind development environment.

## Prerequisites

### Required Software

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **Redis** - [Download](https://redis.io/download)
4. **FFmpeg** - [Download](https://ffmpeg.org/download.html)

### macOS Installation

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install postgresql redis ffmpeg

# Start services
brew services start postgresql
brew services start redis
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib redis-server ffmpeg

# Start services
sudo systemctl start postgresql
sudo systemctl start redis
```

### Windows

- PostgreSQL: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Redis: Use WSL2 or download from [redis.io](https://redis.io/download)
- FFmpeg: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE clipmind;

# Create user (optional)
CREATE USER clipmind_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE clipmind TO clipmind_user;

# Exit
\q
```

### 2. Install pgvector Extension

```bash
# Clone pgvector repository
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector

# Build and install
make
sudo make install

# Connect to database and enable extension
psql clipmind
CREATE EXTENSION vector;
\q
```

Or use a managed PostgreSQL service that supports pgvector:
- [Supabase](https://supabase.com) (free tier available)
- [Neon](https://neon.tech) (serverless PostgreSQL)
- [AWS RDS](https://aws.amazon.com/rds/) with pgvector

## Environment Configuration

### Backend Environment

Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/clipmind

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API (Required)
OPENAI_API_KEY=sk-your-key-here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=4294967296
UPLOAD_DIR=./uploads

# Storage (Optional - use local storage if not set)
USE_S3=false
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=clipmind-videos

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

### Frontend Environment

Create `src/.env` or `.env` in root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
# From project root
npm install
```

### 3. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 4. Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker (for video processing):**
```bash
cd backend
npm run dev:worker
```

**Terminal 3 - Frontend:**
```bash
# From project root
npm run dev
```

## Verify Installation

1. **Backend Health Check:**
   - Visit: http://localhost:3000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   - Visit: http://localhost:8080
   - Should see ClipMind landing page

3. **Database:**
   ```bash
   psql clipmind
   \dt  # Should show tables: users, videos, transcripts, segments, insights, embeddings
   \q
   ```

4. **Redis:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create new secret key
5. Copy key and add to `backend/.env` as `OPENAI_API_KEY`

**Note:** OpenAI API usage incurs costs. Monitor usage in the dashboard.

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -l

# Check connection string in .env
# Ensure DATABASE_URL format: postgresql://user:password@host:port/database
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Check REDIS_URL in .env
```

### FFmpeg Not Found

```bash
# Verify installation
ffmpeg -version

# If not found, reinstall:
# macOS: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### pgvector Extension Error

If you see "extension vector does not exist":
- Ensure pgvector is installed on your system
- Run: `CREATE EXTENSION vector;` in PostgreSQL
- Or use a managed PostgreSQL service with pgvector support

## Next Steps

1. Register a test user via `/api/auth/register`
2. Upload a test video
3. Monitor processing in worker logs
4. Check database for processed data

## Production Deployment

For production deployment, see `PROJECT_AUDIT.md` Phase 4 recommendations:
- Use managed PostgreSQL (RDS, Cloud SQL)
- Use managed Redis (ElastiCache, Redis Cloud)
- Use S3 for video storage
- Set up proper environment variables
- Enable HTTPS
- Configure CORS properly
- Set up monitoring and logging

