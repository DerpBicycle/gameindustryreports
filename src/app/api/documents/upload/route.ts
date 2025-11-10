import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { saveDocument } from '@/lib/database';
import { Document } from '@/types/document';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract metadata from filename
function extractMetadataFromFilename(filename: string) {
  const metadata: {
    source?: string;
    year?: number;
    quarter?: string;
    region?: string;
    tags: string[];
  } = {
    tags: [],
  };

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');

  // Extract year (4 digits)
  const yearMatch = nameWithoutExt.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[1]);
  }

  // Extract quarter (Q1, Q2, Q3, Q4)
  const quarterMatch = nameWithoutExt.match(/\b(Q[1-4])\b/i);
  if (quarterMatch) {
    metadata.quarter = quarterMatch[1].toUpperCase();
  }

  // Extract source (text before dash or hyphen)
  const sourceMatch = nameWithoutExt.match(/^([^-–—]+)/);
  if (sourceMatch) {
    metadata.source = sourceMatch[1].trim();
  }

  // Extract potential regions
  const regions = ['Global', 'North America', 'Europe', 'Asia', 'APAC', 'EMEA', 'US', 'UK', 'China', 'Japan'];
  for (const region of regions) {
    if (new RegExp(`\\b${region}\\b`, 'i').test(nameWithoutExt)) {
      metadata.region = region;
      break;
    }
  }

  // Extract common tags based on filename content
  const commonTags = [
    'Gaming', 'Mobile', 'Console', 'PC', 'Market Report', 'Analysis',
    'Revenue', 'Trends', 'Forecast', 'Strategy', 'Competition', 'Playbook',
    'Guide', 'Industry', 'Research', 'Data', 'Statistics'
  ];

  for (const tag of commonTags) {
    if (new RegExp(`\\b${tag}\\b`, 'i').test(nameWithoutExt)) {
      metadata.tags.push(tag);
    }
  }

  return metadata;
}

// Helper function to determine category from filename
function determineCategoryFromFilename(filename: string): string {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.includes('market') || lowerFilename.includes('revenue') || lowerFilename.includes('forecast')) {
    return 'Market Analysis';
  }
  if (lowerFilename.includes('trend') || lowerFilename.includes('industry')) {
    return 'Industry Trends';
  }
  if (lowerFilename.includes('playbook') || lowerFilename.includes('guide') || lowerFilename.includes('strategy')) {
    return 'Strategy Guides';
  }
  if (lowerFilename.includes('research') || lowerFilename.includes('study')) {
    return 'Research Reports';
  }
  if (lowerFilename.includes('data') || lowerFilename.includes('statistics')) {
    return 'Data Reports';
  }

  return 'General';
}

// POST /api/documents/upload - Handle file upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const documentId = uuidv4();

    // Create safe filename
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'documents');

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Define file path
    const filePath = path.join(uploadDir, safeFilename);
    const relativeFilePath = `/documents/${safeFilename}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract metadata from filename
    const extractedMetadata = extractMetadataFromFilename(file.name);
    const category = formData.get('category') as string || determineCategoryFromFilename(file.name);

    // Get optional fields from form data
    const title = (formData.get('title') as string) || file.name.replace(/\.pdf$/i, '');
    const description = formData.get('description') as string;
    const customTags = formData.get('tags') as string;

    // Merge extracted tags with custom tags
    const allTags = [...extractedMetadata.tags];
    if (customTags) {
      const customTagArray = customTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      allTags.push(...customTagArray);
    }

    // Remove duplicate tags
    const uniqueTags = [...new Set(allTags)];

    // Create document object
    const document: Document = {
      id: documentId,
      title,
      fileName: file.name,
      filePath: relativeFilePath,
      fileSize: file.size,
      category,
      uploadDate: new Date().toISOString(),
      processingStatus: 'pending',
      metadata: {
        source: extractedMetadata.source,
        year: extractedMetadata.year,
        quarter: extractedMetadata.quarter,
        region: extractedMetadata.region,
        tags: uniqueTags,
        description: description || undefined,
      },
    };

    // Save document to database
    await saveDocument(document);

    return NextResponse.json({
      success: true,
      data: document,
      message: 'File uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
