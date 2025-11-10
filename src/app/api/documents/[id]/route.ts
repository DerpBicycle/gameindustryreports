import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, saveDocument, deleteDocument } from '@/lib/database';
import { Document } from '@/types/document';

// GET /api/documents/[id] - Get a single document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await getDocumentById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if document exists
    const existingDocument = await getDocumentById(id);

    if (!existingDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document with new data, preserving existing values for fields not provided
    const updatedDocument: Document = {
      ...existingDocument,
      title: body.title ?? existingDocument.title,
      fileName: body.fileName ?? existingDocument.fileName,
      filePath: body.filePath ?? existingDocument.filePath,
      fileSize: body.fileSize ?? existingDocument.fileSize,
      category: body.category ?? existingDocument.category,
      uploadDate: body.uploadDate ?? existingDocument.uploadDate,
      processedDate: body.processedDate ?? existingDocument.processedDate,
      processingStatus: body.processingStatus ?? existingDocument.processingStatus,
      metadata: {
        source: body.metadata?.source ?? existingDocument.metadata.source,
        year: body.metadata?.year ?? existingDocument.metadata.year,
        quarter: body.metadata?.quarter ?? existingDocument.metadata.quarter,
        region: body.metadata?.region ?? existingDocument.metadata.region,
        tags: body.metadata?.tags ?? existingDocument.metadata.tags,
        description: body.metadata?.description ?? existingDocument.metadata.description,
      },
      aiAnalysis: body.aiAnalysis ?? existingDocument.aiAnalysis,
    };

    // Save updated document
    await saveDocument(updatedDocument);

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully',
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if document exists
    const document = await getDocumentById(id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete document from database
    await deleteDocument(id);

    // Note: This does not delete the actual file from the filesystem
    // You may want to add file deletion logic here if needed

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
