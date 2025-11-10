'use client';

import { Document } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { FileText } from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onViewDetails: (document: Document) => void;
}

export function DocumentGrid({ documents, onViewDetails }: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mb-4 h-16 w-16 text-gray-400" />
        <h3 className="mb-2 text-xl font-semibold text-gray-900">No documents found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((document, index) => (
        <DocumentCard
          key={document.id}
          document={document}
          onViewDetails={onViewDetails}
          index={index}
        />
      ))}
    </div>
  );
}
