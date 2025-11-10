# Document Processing Guide

## Setup

1. **Set API Key**
   ```bash
   # Add to .env.local
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

2. **Ensure Supabase is configured**
   ```bash
   # Also in .env.local
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

## Processing Commands

### Quick Test (5 random documents)
```bash
npm run analyze
```

### Process Pending Documents
```bash
npm run process
```
Processes only documents with status 'pending' or 'failed'

### Process All Documents (Force Reprocess)
```bash
npm run process:all
```
Reprocesses all 429 documents

## How It Works

The batch processor:
- Processes 10 documents per batch
- Runs 3 batches in parallel
- Saves results to Supabase automatically
- Tracks processing records to avoid duplicates

## Performance

**Processing Time:**
- 10 documents: ~10-15 minutes
- 100 documents: ~1.5-2 hours
- 429 documents (full collection): ~10-15 hours

**Costs (Claude 3.5 Sonnet):**
- Per document: ~$0.10-0.20
- Full collection (429): ~$60-100

**What Gets Analyzed:**
- Document classification (report type, focus areas, etc.)
- Entity extraction (companies, games, technologies)
- Metric extraction (market sizes, user numbers, etc.)
- Key findings and insights
- Comprehensive summaries
- Data quality assessment

## Results

Results are stored in Supabase and include:
- AI-generated summaries
- Key insights and findings
- Extracted metrics with context
- Entity recognition (companies, games, etc.)
- Topics and themes
- Data quality scores

All processed data is immediately available in the web UI.
