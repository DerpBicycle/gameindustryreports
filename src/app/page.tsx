'use client';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { Hero } from '@/components/features/Hero';
import { SearchBar } from '@/components/features/SearchBar';
import { FilterSidebar } from '@/components/features/FilterSidebar';
import { DocumentGrid } from '@/components/features/DocumentGrid';
import { DocumentDetailModal } from '@/components/features/DocumentDetailModal';
import { Button } from '@/components/ui/Button';
import { Document, FilterOptions } from '@/types/document';
import {
  extractCategories,
  extractYears,
  extractQuarters,
  extractRegions,
  getTopTags,
} from '@/lib/documentHelpers';

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Extracted filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [quarters, setQuarters] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch all documents initially
  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/documents');
        const data = await response.json();

        if (data.documents) {
          setDocuments(data.documents);

          // Extract filter options
          setCategories(extractCategories(data.documents));
          setYears(extractYears(data.documents));
          setQuarters(extractQuarters(data.documents));
          setRegions(extractRegions(data.documents));
          setAllTags(getTopTags(data.documents, 30));
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  // Apply filters and search locally
  useEffect(() => {
    let filtered = [...documents];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((doc) => doc.category === filters.category);
    }

    // Apply year filter
    if (filters.year) {
      filtered = filtered.filter((doc) => doc.metadata.year === filters.year);
    }

    // Apply quarter filter
    if (filters.quarter) {
      filtered = filtered.filter((doc) => doc.metadata.quarter === filters.quarter);
    }

    // Apply region filter
    if (filters.region) {
      filtered = filtered.filter((doc) => doc.metadata.region === filters.region);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((doc) =>
        filters.tags!.every((tag) => doc.metadata.tags.includes(tag))
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => {
        const searchableText = [
          doc.title,
          doc.metadata.description || '',
          doc.aiAnalysis?.summary || '',
          doc.metadata.tags.join(' '),
          doc.category,
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison =
            new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'relevance':
          const aScore = a.aiAnalysis ? 1 : 0;
          const bScore = b.aiAnalysis ? 1 : 0;
          comparison = aScore - bScore;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredDocuments(filtered);
  }, [documents, filters, searchQuery]);

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDocument(null), 300);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={handleSearchChange} />
          </div>
          <Button
            onClick={() => setIsMobileSidebarOpen(true)}
            variant="outline"
            className="lg:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              'Loading documents...'
            ) : (
              <>
                Showing {filteredDocuments.length} of {documents.length} report
                {documents.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            years={years}
            quarters={quarters}
            regions={regions}
            allTags={allTags}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Document Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              </div>
            ) : (
              <DocumentGrid
                documents={filteredDocuments}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        </div>
      </main>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDocument}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
