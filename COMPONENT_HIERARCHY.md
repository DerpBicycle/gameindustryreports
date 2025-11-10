# Component Hierarchy

## Main Page Structure

```
Home (page.tsx)
│
├── Hero
│   └── Animated feature highlights
│
├── Search & Filter Controls
│   ├── SearchBar
│   │   ├── Input (UI)
│   │   └── Icons (Search, X)
│   │
│   └── Mobile Filter Button
│       └── Button (UI)
│
├── Results Count
│
└── Main Content Area
    │
    ├── FilterSidebar
    │   ├── Desktop: Sticky Sidebar
    │   └── Mobile: Slide-out Drawer
    │       ├── Filter Sections (Collapsible)
    │       │   ├── Category (Select)
    │       │   ├── Year (Select)
    │       │   ├── Quarter (Select)
    │       │   ├── Region (Select)
    │       │   ├── Tags (Badge Grid)
    │       │   └── Sort Options (Select x2)
    │       │
    │       └── Clear All Button
    │
    └── DocumentGrid
        │
        ├── Loading State (Spinner)
        │
        ├── Empty State (No Results)
        │
        └── Document Cards (Grid)
            │
            └── DocumentCard (for each document)
                ├── Card (UI)
                ├── Badge (Category)
                ├── Date Icon
                ├── Title
                ├── Description
                ├── AI Summary Box
                ├── Metadata Badges
                ├── Tags (limited)
                └── View Details Button

DocumentDetailModal (Portal)
├── Modal (UI)
├── Title
├── Metadata Grid
│   ├── Category
│   ├── Date
│   ├── Year/Quarter
│   ├── Region
│   ├── Source
│   └── File Size
├── Description Section
├── AI Analysis
│   ├── Summary Box
│   ├── Key Insights List
│   ├── Topics (Badges)
│   ├── Entities (Badges)
│   └── Sentiment + Confidence
├── All Tags (Badges)
└── Actions
    ├── Download Button
    └── Close Button
```

## Component Relationships

### UI Components (Reusable)
- **Button**: Used in FilterSidebar, DocumentCard, DocumentDetailModal
- **Card**: Used in DocumentCard
- **Badge**: Used in DocumentCard, FilterSidebar, DocumentDetailModal
- **Input**: Used in SearchBar
- **Select**: Used in FilterSidebar
- **Modal**: Used in DocumentDetailModal

### Feature Components (Specific)
- **Hero**: Standalone, appears once at top
- **SearchBar**: Controlled by page.tsx state
- **FilterSidebar**: Controlled by page.tsx state, used once
- **DocumentGrid**: Receives filtered documents, renders multiple DocumentCards
- **DocumentCard**: Receives single document, triggers modal
- **DocumentDetailModal**: Controlled by page.tsx state, displays selected document

## Data Flow

```
page.tsx
  │
  ├─[fetch]──> /api/documents
  │              │
  │              └──> getAllDocuments()
  │                     │
  │                     └──> data/documents.json
  │
  ├─[extract filter options]──> documentHelpers
  │
  ├─[state: documents, filters, search]
  │
  ├─[apply filters + search]──> filteredDocuments
  │
  ├──[pass to]──> DocumentGrid
  │                  │
  │                  └──> DocumentCard (multiple)
  │                          │
  │                          └─[onClick]──> handleViewDetails()
  │                                            │
  │                                            └──> DocumentDetailModal
  │
  └──[controls]──> SearchBar, FilterSidebar
```

## State Management

### Page Level State (page.tsx)
```typescript
documents: Document[]              // All documents from API
filteredDocuments: Document[]      // After filters + search
isLoading: boolean                 // Loading state
selectedDocument: Document | null  // For modal
isModalOpen: boolean              // Modal visibility
isMobileSidebarOpen: boolean      // Mobile sidebar state
searchQuery: string               // Search input
filters: FilterOptions            // All filter values

// Derived state for filters
categories: string[]
years: number[]
quarters: string[]
regions: string[]
allTags: string[]
```

### Event Handlers
```typescript
handleViewDetails(document)    // Open modal with document
handleCloseModal()            // Close modal
handleFiltersChange(filters)  // Update filters
handleSearchChange(query)     // Update search
```

## Styling Architecture

### Tailwind CSS Utilities
- Responsive breakpoints: sm, md, lg, xl
- Spacing scale: 1-8, 12, 16, 20, 24
- Colors: gray, blue, green, purple, orange, indigo, red
- Border radius: lg (8px), xl (12px)
- Shadows: sm, md

### Custom CSS
```css
.bg-grid-white/10  // Grid pattern for hero
```

### Component-Specific Classes
- Cards: hover effects, transitions
- Buttons: focus rings, disabled states
- Inputs: error states, focus states
- Modal: backdrop blur, z-index layers

## Animation Layers (Framer Motion)

1. **Hero**: Fade in + slide up on page load
2. **Feature highlights**: Staggered entrance
3. **Document cards**: Staggered entrance (50ms delay each)
4. **Modal**: Fade + scale entrance/exit
5. **Mobile sidebar**: Slide from left
6. **Filter sections**: Collapsible height animation

## Responsive Breakpoints

- **< 640px (Mobile)**
  - 1 column grid
  - Drawer sidebar
  - Stacked controls

- **640px - 1024px (Tablet)**
  - 2 column grid
  - Drawer sidebar
  - Side-by-side controls

- **> 1024px (Desktop)**
  - 3 column grid
  - Fixed sidebar
  - Optimal layout
