// Enhanced document classification taxonomy based on analysis findings
export const ENHANCED_TAXONOMY = {
  reportTypes: [
    'Market Research Report',
    'Financial Report',
    'Trend Analysis',
    'Survey Research',
    'Investment Tracking',
    'Performance Analytics',
    'Technical White Paper',
    'Practical Guide'
  ],

  contentFocus: [
    'Market & Industry Analysis',
    'Technology & Innovation',
    'User Behavior & Demographics',
    'Financial & Investment',
    'Marketing & User Acquisition',
    'Workplace & HR',
    'Regional Analysis',
    'Platform Ecosystem',
    'Game Development'
  ],

  geographicScope: [
    'Global',
    'Regional',
    'Country-Specific',
    'Multi-Regional Comparison'
  ],

  temporalNature: [
    'Historical Analysis',
    'Current State',
    'Forward-Looking',
    'Periodic Update'
  ],

  dataCharacteristics: [
    'Heavily Quantitative',
    'Mixed Quant/Qual',
    'Primarily Qualitative',
    'Primary Research',
    'Secondary Research'
  ],

  targetAudience: [
    'Executives & Decision Makers',
    'Investors & VCs',
    'Developers & Technical Teams',
    'Marketers & UA Managers',
    'Analysts & Researchers',
    'Industry Professionals'
  ]
};

// Entity types to extract based on document analysis
export const ENTITY_TYPES = {
  companies: {
    patterns: ['studios', 'publishers', 'platforms', 'investors', 'service providers'],
    examples: ['Unity', 'Epic Games', 'Tencent', 'PlayStation', 'Xbox']
  },

  games: {
    patterns: ['game titles', 'franchises'],
    examples: ['Fortnite', 'Roblox', 'Call of Duty', 'Genshin Impact']
  },

  people: {
    patterns: ['executives', 'influencers', 'analysts'],
    examples: ['Tim Sweeney', 'Hideo Kojima']
  },

  technologies: {
    patterns: ['engines', 'platforms', 'tools', 'frameworks'],
    examples: ['Unreal Engine', 'Unity Engine', 'AWS', 'Azure']
  },

  regions: {
    patterns: ['countries', 'continents', 'markets'],
    examples: ['North America', 'APAC', 'Europe', 'China', 'Japan']
  },

  metrics: {
    patterns: ['revenue', 'users', 'growth rates', 'market size'],
    examples: ['$2.4B revenue', '31.7M users', '27% YoY growth']
  },

  genres: {
    patterns: ['game categories', 'sub-genres'],
    examples: ['RPG', 'Battle Royale', 'Match-3', 'Hyper-Casual']
  },

  platforms: {
    patterns: ['gaming platforms', 'distribution channels'],
    examples: ['Steam', 'iOS', 'Android', 'PlayStation Network']
  },

  businessModels: {
    patterns: ['monetization strategies', 'business approaches'],
    examples: ['Free-to-Play', 'Subscription', 'Pay-to-Play', 'Freemium']
  }
};

// Processing priority based on report type
export const PROCESSING_PRIORITIES = {
  high: [
    'Market Research Report',
    'Investment Tracking',
    'Survey Research'
  ],
  medium: [
    'Trend Analysis',
    'Performance Analytics',
    'Financial Report'
  ],
  low: [
    'Practical Guide',
    'Technical White Paper'
  ]
};

// Document characteristics that need special handling
export const SPECIAL_HANDLING = {
  chartHeavy: {
    indicators: ['low text extraction', 'presentation format', 'financial reports'],
    approach: 'OCR + Chart-to-data extraction + GPT-4V'
  },

  dataIntensive: {
    indicators: ['tables', 'statistics', 'benchmarks'],
    approach: 'Structured data extraction + Metric normalization'
  },

  narrative: {
    indicators: ['trend analysis', 'predictions', 'insights'],
    approach: 'Deep semantic analysis + Key point extraction'
  },

  survey: {
    indicators: ['methodology sections', 'sample sizes', 'demographics'],
    approach: 'Methodology extraction + Finding categorization'
  }
};
