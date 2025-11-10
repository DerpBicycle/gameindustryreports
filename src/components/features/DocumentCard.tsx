'use client';

import { motion } from 'framer-motion';
import { Calendar, FileText, Tag, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Document } from '@/types/document';

interface DocumentCardProps {
  document: Document;
  onViewDetails: (document: Document) => void;
  index: number;
}

export function DocumentCard({ document, onViewDetails, index }: DocumentCardProps) {
  const formattedDate = new Date(document.uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card hover className="h-full flex flex-col">
        <CardHeader>
          <div className="mb-2 flex items-start justify-between gap-2">
            <Badge variant="primary">{document.category}</Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {document.title}
          </h3>
        </CardHeader>

        <CardContent className="flex-1">
          {document.metadata.description && (
            <p className="mb-4 text-sm text-gray-600 line-clamp-3">
              {document.metadata.description}
            </p>
          )}

          {document.aiAnalysis?.summary && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-gray-700 line-clamp-2">
                {document.aiAnalysis.summary}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {document.metadata.year && (
              <Badge variant="default" size="sm">
                {document.metadata.year}
                {document.metadata.quarter && ` ${document.metadata.quarter}`}
              </Badge>
            )}
            {document.metadata.region && (
              <Badge variant="default" size="sm">
                {document.metadata.region}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {document.metadata.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-gray-500"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
              {document.metadata.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{document.metadata.tags.length - 3} more
                </span>
              )}
            </div>
            <Button
              onClick={() => onViewDetails(document)}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <Eye className="mr-1 h-4 w-4" />
              View Details
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
