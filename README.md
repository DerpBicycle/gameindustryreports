# Game Industry Reports

A web application for browsing, uploading, and analyzing game industry reports using AI. Browse 429+ industry reports with intelligent search, filtering, and AI-powered document analysis.

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - Claude API key for AI processing

### 2. Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Copy contents of supabase/schema.sql and run in Supabase
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Index Documents

```bash
npm run index
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment (Coolify)

### Environment Variables

Set these in Coolify:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NODE_ENV=production`

### Build & Deploy

The project includes a Dockerfile for containerized deployment:

```bash
docker build -t game-industry-reports .
docker run -p 3000:3000 game-industry-reports
```

Coolify will automatically use the Dockerfile for deployment.

## Features

- Browse 429+ game industry reports
- Advanced filtering (category, year, quarter, region, tags)
- Real-time search
- AI-powered document analysis
- Upload new documents
- Responsive design

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS 4
- Anthropic Claude API
- Framer Motion

## Available Scripts

```bash
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Start production server
npm run index        # Index PDF documents to Supabase
npm run migrate      # Migrate existing JSON data to Supabase
npm run process:enhanced  # Process documents with AI
npm run analyze      # Analyze 5 random documents
```

## Project Structure

```
├── src/
│   ├── app/           # Next.js pages & API routes
│   ├── components/    # React components
│   ├── lib/          # Database & utilities
│   ├── types/        # TypeScript types
│   └── config/       # Configuration
├── scripts/          # CLI tools
├── supabase/         # Database schema
└── [Category Folders]/  # PDF files (429 reports)
```

## License

Private and proprietary.
