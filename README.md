# Game Industry Reports

A comprehensive web application for browsing, uploading, and analyzing game industry reports using AI. This platform provides a centralized location for game industry reports with intelligent search, filtering, and AI-powered document analysis.

## Features

### Document Management
- Browse 429+ game industry reports across 10 categories
- Advanced filtering by category, year, quarter, region, and tags
- Real-time search across titles, descriptions, and AI-generated summaries
- Sort by date, title, or relevance
- Upload new PDF documents with automatic metadata extraction

### AI-Powered Analysis
- Automatic PDF text extraction and OCR
- AI-generated summaries (2-3 paragraphs)
- Key insights extraction (5-10 bullet points)
- Topic and entity identification
- Automatic categorization and tagging
- Sentiment analysis
- Smart reprocessing prevention using file hashing

### User Experience
- Modern, responsive design with Tailwind CSS
- Smooth animations using Framer Motion
- Mobile-first approach
- Professional UI components
- Document detail modals with comprehensive information
- Upload progress tracking

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5.8
- **Styling**: Tailwind CSS 4.1
- **Animations**: Framer Motion 12
- **Icons**: Lucide React
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
- **PDF Processing**: pdf-parse
- **Database**: File-based JSON storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DerpBicycle/gameindustryreports.git
cd gameindustryreports
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Anthropic API key
ANTHROPIC_API_KEY=your-api-key-here
```

4. Index existing documents:
```bash
npm run index
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
gameindustryreports/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes
│   │   │   ├── documents/        # Document CRUD operations
│   │   │   ├── categories/       # Category listing
│   │   │   └── process/          # AI processing endpoints
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Homepage
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── features/             # Feature-specific components
│   ├── lib/
│   │   ├── database.ts           # Database operations
│   │   ├── ai-processor.ts       # AI processing pipeline
│   │   └── documentHelpers.ts    # Utility functions
│   ├── types/
│   │   └── document.ts           # TypeScript type definitions
│   └── styles/
│       └── tailwind.css          # Global styles
├── scripts/
│   ├── index-documents.js        # Document indexing script
│   └── process-documents.ts      # AI processing script
├── data/
│   ├── documents.json            # Document database
│   └── processing-records.json   # Processing history
└── [Category Folders]/           # PDF collections
    ├── Blockchain NFT Web3/ (12 reports)
    ├── Cloud Gaming/ (3 reports)
    ├── Esports/ (6 reports)
    ├── General Industry/ (93 reports)
    ├── HR/ (5 reports)
    ├── Investments/ (46 reports)
    ├── Marketing & Streaming/ (40 reports)
    ├── Mobile/ (157 reports)
    ├── Regional Reports/ (61 reports)
    └── XR Metaverse/ (6 reports)
```

## Usage

### Browsing Documents

1. Visit the homepage to see all available reports
2. Use the search bar to find specific reports
3. Apply filters in the sidebar (category, year, quarter, region, tags)
4. Click "View Details" to see full document information and AI analysis

### Uploading Documents

Use the API endpoint to upload new documents:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@path/to/report.pdf" \
  -F "category=General Industry"
```

### AI Processing

Process all unprocessed documents:
```bash
npm run process
```

Process a specific document:
```bash
npm run process:file "path/to/document.pdf"
```

### Document Indexing

Re-index all documents:
```bash
npm run index
```

Force re-indexing:
```bash
npm run index -- --force
```

## API Reference

### Documents

- `GET /api/documents` - List all documents with filtering
- `GET /api/documents/[id]` - Get a single document
- `POST /api/documents` - Create a new document entry
- `PUT /api/documents/[id]` - Update a document
- `DELETE /api/documents/[id]` - Delete a document
- `POST /api/documents/upload` - Upload a PDF file

### Processing

- `POST /api/process` - Process a document with AI
- `GET /api/process?documentId=xxx` - Check processing status

### Categories

- `GET /api/categories` - Get all categories with document counts

## Contributing

We invite the community to contribute by adding new reports to this repository:

1. Fork the repository
2. Create a new branch for your contribution
3. Add the new report to the appropriate category folder
4. Follow the naming convention: `<Source> - <Title> (<Year>).pdf`
5. Commit your changes
6. Push to your forked repository
7. Open a pull request

### Format Requirements

- Reports should be in PDF format
- Use standardized naming: `<Writer> - <Title> (<YEAR>).pdf`
- No DRM or proprietary restrictions
- Place in appropriate category folder

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run index` - Index documents
- `npm run process` - Process documents with AI

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## AI Processing Details

For each document, the AI generates:
- **Summary**: 2-3 paragraph executive summary
- **Key Insights**: 5-10 actionable bullet points
- **Topics**: Main subjects identified
- **Entities**: Companies, products, regions mentioned
- **Sentiment**: Overall tone analysis
- **Category**: Automatic classification

Processing time & cost:
- 10-page document: ~30-45 seconds, $0.02-0.05
- 50-page document: ~60-90 seconds, $0.10-0.25
- 200-page document: ~3-5 minutes, $0.50-1.00

## Acknowledgments

This project relies on the contributions of the game industry community. We appreciate your help in maintaining and expanding this repository.

Built with:
- [Next.js](https://nextjs.org/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

Based on [Eric's Website Template](https://github.com/DerpBicycle/erics-website-template)

## Get Involved

If you have questions, suggestions, or would like to contribute, feel free to open a discussion or reach out directly.
