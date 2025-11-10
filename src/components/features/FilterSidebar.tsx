'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { FilterOptions } from '@/types/document';

interface FilterSidebarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  years: number[];
  quarters: string[];
  regions: string[];
  allTags: string[];
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  categories,
  years,
  quarters,
  regions,
  allTags,
  isMobileOpen,
  onMobileClose,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    year: true,
    quarter: true,
    region: true,
    tags: true,
    sort: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags.length > 0 ? newTags : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.year ||
    filters.quarter ||
    filters.region ||
    (filters.tags && filters.tags.length > 0);

  const FilterSection = ({
    title,
    section,
    children,
  }: {
    title: string;
    section: keyof typeof expandedSections;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(section)}
        className="flex w-full items-center justify-between py-2 text-left font-semibold text-gray-900"
      >
        {title}
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Clear All
            </Button>
          )}
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <FilterSection title="Category" section="category">
          <Select
            value={filters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value || undefined)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </FilterSection>

        <FilterSection title="Year" section="year">
          <Select
            value={filters.year?.toString() || ''}
            onChange={(e) =>
              updateFilter('year', e.target.value ? parseInt(e.target.value) : undefined)
            }
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </FilterSection>

        <FilterSection title="Quarter" section="quarter">
          <Select
            value={filters.quarter || ''}
            onChange={(e) => updateFilter('quarter', e.target.value || undefined)}
          >
            <option value="">All Quarters</option>
            {quarters.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </Select>
        </FilterSection>

        <FilterSection title="Region" section="region">
          <Select
            value={filters.region || ''}
            onChange={(e) => updateFilter('region', e.target.value || undefined)}
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </FilterSection>

        <FilterSection title="Tags" section="tags">
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags?.includes(tag) ? 'primary' : 'default'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Sort By" section="sort">
          <div className="space-y-2">
            <Select
              value={filters.sortBy || 'date'}
              onChange={(e) => updateFilter('sortBy', e.target.value as any)}
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="relevance">Relevance</option>
            </Select>
            <Select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => updateFilter('sortOrder', e.target.value as any)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
          </div>
        </FilterSection>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-4 h-[calc(100vh-2rem)] w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
