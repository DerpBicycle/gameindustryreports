import { NextRequest, NextResponse } from 'next/server';
import { processDocument, shouldProcessDocument } from '@/lib/ai-processor';
import { getDocumentById } from '@/lib/database';

/**
 * API endpoint to process a document with AI
 *
 * POST /api/process
 * Body: { documentId: string, force?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, force = false } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if processing is needed (unless force is true)
    if (!force) {
      const { shouldProcess, reason } = await shouldProcessDocument(
        document.filePath
      );

      if (!shouldProcess) {
        return NextResponse.json({
          success: true,
          message: `Document already processed: ${reason}`,
          document,
        });
      }
    }

    // Process document
    const result = await processDocument(document);

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully',
      document: result.document,
      analysis: result.aiAnalysis,
    });
  } catch (error) {
    console.error('Error processing document:', error);

    return NextResponse.json(
      {
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to check processing status
 *
 * GET /api/process?documentId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check processing status
    const { shouldProcess, reason } = await shouldProcessDocument(
      document.filePath
    );

    return NextResponse.json({
      documentId: document.id,
      fileName: document.fileName,
      processingStatus: document.processingStatus,
      shouldProcess,
      reason,
      hasAnalysis: !!document.aiAnalysis,
      processedDate: document.processedDate,
    });
  } catch (error) {
    console.error('Error checking processing status:', error);

    return NextResponse.json(
      {
        error: 'Failed to check processing status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
