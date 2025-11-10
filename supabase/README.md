# Supabase Setup

## Initial Setup

1. Create a new Supabase project at https://supabase.com

2. Get your credentials from Project Settings > API:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)

3. Add to `.env.local`:
```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

Run the SQL in `schema.sql` in your Supabase SQL Editor (Database > SQL Editor)

This creates:
- `documents` table - stores all document metadata and AI analysis
- `processing_records` table - tracks document processing history
- Indexes for performance
- Full-text search indexes
- Auto-update triggers

## Migrate Existing Data

If you have existing data in `data/documents.json`, run:

```bash
npm run migrate
```

This will import all existing documents into Supabase.
