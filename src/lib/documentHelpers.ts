import { Document } from '@/types/document';

/**
 * Extract unique categories from documents
 */
export function extractCategories(documents: Document[]): string[] {
  const categories = new Set<string>();
  documents.forEach((doc) => {
    if (doc.category) {
      categories.add(doc.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Extract unique years from documents
 */
export function extractYears(documents: Document[]): number[] {
  const years = new Set<number>();
  documents.forEach((doc) => {
    if (doc.metadata.year) {
      years.add(doc.metadata.year);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Extract unique quarters from documents
 */
export function extractQuarters(documents: Document[]): string[] {
  const quarters = new Set<string>();
  documents.forEach((doc) => {
    if (doc.metadata.quarter) {
      quarters.add(doc.metadata.quarter);
    }
  });
  return Array.from(quarters).sort();
}

/**
 * Extract unique regions from documents
 */
export function extractRegions(documents: Document[]): string[] {
  const regions = new Set<string>();
  documents.forEach((doc) => {
    if (doc.metadata.region) {
      regions.add(doc.metadata.region);
    }
  });
  return Array.from(regions).sort();
}

/**
 * Extract all unique tags from documents
 */
export function extractAllTags(documents: Document[]): string[] {
  const tags = new Set<string>();
  documents.forEach((doc) => {
    doc.metadata.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get the top N most common tags
 */
export function getTopTags(documents: Document[], limit: number = 20): string[] {
  const tagCounts = new Map<string, number>();

  documents.forEach((doc) => {
    doc.metadata.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}
