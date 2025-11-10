'use client';

import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Document } from '@/types/document';
import {
  Calendar,
  FileText,
  Tag,
  Globe,
  Download,
  TrendingUp,
  Lightbulb,
  Hash,
  Users,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDetailModal({ document, isOpen, onClose }: DocumentDetailModalProps) {
  if (!document) return null;

  const formattedDate = new Date(document.uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={document.title}>
      <div className="space-y-6">
        {/* Metadata Section */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-semibold text-gray-900">{document.category}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upload Date</p>
              <p className="font-semibold text-gray-900">{formattedDate}</p>
            </div>
          </div>

          {document.metadata.year && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Year / Quarter</p>
                <p className="font-semibold text-gray-900">
                  {document.metadata.year}
                  {document.metadata.quarter && ` - ${document.metadata.quarter}`}
                </p>
              </div>
            </div>
          )}

          {document.metadata.region && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-semibold text-gray-900">{document.metadata.region}</p>
              </div>
            </div>
          )}

          {document.metadata.source && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-semibold text-gray-900">{document.metadata.source}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Download className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">File Size</p>
              <p className="font-semibold text-gray-900">{formattedSize(document.fileSize)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {document.metadata.description && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
            <p className="text-gray-700">{document.metadata.description}</p>
          </div>
        )}

        {/* AI Analysis Section */}
        {document.aiAnalysis && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI Summary</h3>
              </div>
              <p className="text-blue-800">{document.aiAnalysis.summary}</p>
              {document.aiAnalysis.pageCount && (
                <p className="mt-2 text-sm text-blue-700">
                  {document.aiAnalysis.pageCount} pages analyzed
                </p>
              )}
            </div>

            {/* Key Insights */}
            {document.aiAnalysis.keyInsights &&
              document.aiAnalysis.keyInsights.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Key Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {document.aiAnalysis.keyInsights.map((insight, index) => (
                      <li key={index} className="flex gap-2 text-green-800">
                        <span className="text-green-600">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Topics & Entities */}
            <div className="grid gap-4 sm:grid-cols-2">
              {document.aiAnalysis.topics && document.aiAnalysis.topics.length > 0 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <h3 className="mb-2 font-semibold text-purple-900">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.aiAnalysis.topics.map((topic) => (
                      <Badge key={topic} variant="default">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {document.aiAnalysis.entities && document.aiAnalysis.entities.length > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h3 className="mb-2 font-semibold text-orange-900">Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.aiAnalysis.entities.map((entity) => (
                      <Badge key={entity} variant="default">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sentiment */}
            {document.aiAnalysis.sentiment && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Sentiment Analysis</h3>
                    <p className="capitalize text-gray-700">{document.aiAnalysis.sentiment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(document.aiAnalysis.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {document.metadata.tags.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {document.metadata.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 pt-4">
          <Button variant="primary" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
