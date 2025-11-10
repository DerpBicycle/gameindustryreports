import { NextRequest, NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/database';

// GET /api/categories - Get all unique categories
export async function GET(request: NextRequest) {
  try {
    const documents = await getAllDocuments();

    // Extract unique categories
    const categoriesSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.category) {
        categoriesSet.add(doc.category);
      }
    });

    // Convert to array and sort alphabetically
    const categories = Array.from(categoriesSet).sort();

    // Get document count per category
    const categoriesWithCount = categories.map(category => ({
      name: category,
      count: documents.filter(doc => doc.category === category).length,
    }));

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
