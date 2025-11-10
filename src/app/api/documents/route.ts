import { NextRequest, NextResponse } from 'next/server';
import { getAllDocuments, saveDocument } from '@/lib/database';
import { Document, FilterOptions } from '@/types/document';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: FilterOptions = {
      category: searchParams.get('category') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      quarter: searchParams.get('quarter') || undefined,
      region: searchParams.get('region') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    let documents = await getAllDocuments();

    // Apply filters
    documents = filterDocuments(documents, filters);

    // Apply sorting
    documents = sortDocuments(documents, filters.sortBy, filters.sortOrder);

    return NextResponse.json({ documents, count: documents.length });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

function filterDocuments(documents: Document[], filters: FilterOptions): Document[] {
  return documents.filter((doc) => {
    // Category filter
    if (filters.category && doc.category !== filters.category) {
      return false;
    }

    // Year filter
    if (filters.year && doc.metadata.year !== filters.year) {
      return false;
    }

    // Quarter filter
    if (filters.quarter && doc.metadata.quarter !== filters.quarter) {
      return false;
    }

    // Region filter
    if (filters.region && doc.metadata.region !== filters.region) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => doc.metadata.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        doc.title,
        doc.metadata.description || '',
        doc.aiAnalysis?.summary || '',
        doc.metadata.tags.join(' '),
        doc.category,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

function sortDocuments(
  documents: Document[],
  sortBy: FilterOptions['sortBy'] = 'date',
  sortOrder: FilterOptions['sortOrder'] = 'desc'
): Document[] {
  const sorted = [...documents].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison =
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'relevance':
        // For relevance, prioritize documents with AI analysis
        const aScore = a.aiAnalysis ? 1 : 0;
        const bScore = b.aiAnalysis ? 1 : 0;
        comparison = aScore - bScore;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// POST /api/documents - Create a new document entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.title || !body.fileName || !body.filePath || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, title, fileName, filePath, category' },
        { status: 400 }
      );
    }

    // Create document object
    const document: Document = {
      id: body.id,
      title: body.title,
      fileName: body.fileName,
      filePath: body.filePath,
      fileSize: body.fileSize || 0,
      category: body.category,
      uploadDate: body.uploadDate || new Date().toISOString(),
      processedDate: body.processedDate,
      processingStatus: body.processingStatus || 'pending',
      metadata: {
        source: body.metadata?.source,
        year: body.metadata?.year,
        quarter: body.metadata?.quarter,
        region: body.metadata?.region,
        tags: body.metadata?.tags || [],
        description: body.metadata?.description,
      },
      aiAnalysis: body.aiAnalysis,
    };

    // Save document to database
    await saveDocument(document);

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
