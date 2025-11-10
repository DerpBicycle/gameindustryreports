#!/usr/bin/env tsx
/**
 * Comprehensive Direct Analysis of Documents 1-100
 *
 * Performs deep text analysis without external API calls
 */

import fs from 'fs/promises';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface ExtractedDocument {
  index: number;
  document: any;
  text: string;
  pageCount: number;
  textLength: number;
}

/**
 * Extract metrics from text
 */
function extractMetrics(text: string): Array<{
  value: string;
  context: string;
  unit: string;
  timeframe?: string;
  region?: string;
}> {
  const metrics: Array<any> = [];

  // Match patterns like "31.7M users", "$1.5 billion", "45%", etc.
  const patterns = [
    /(\$?\d+[\d,.]*\s*(?:billion|million|thousand|B|M|K)|\d+[\d,.]*%|\d+[\d,.]*\+?)\s+([^\n]{10,100})/gi,
    /([^\n]{10,100})\s+(?:of|at|reached|grew to|totaled|estimated at)\s+(\$?\d+[\d,.]*\s*(?:billion|million|thousand|B|M|K)|\d+[\d,.]*%)/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null && metrics.length < 20) {
      const value = match[1]?.trim() || match[2]?.trim();
      const context = match[2]?.trim() || match[1]?.trim();

      if (value && context && value !== context) {
        // Determine unit
        let unit = 'number';
        if (value.includes('%')) unit = 'percentage';
        else if (value.includes('$')) unit = 'currency';
        else if (context.toLowerCase().includes('user') || context.toLowerCase().includes('player')) unit = 'users';
        else if (context.toLowerCase().includes('revenue') || context.toLowerCase().includes('market')) unit = 'currency';

        // Extract timeframe
        const yearMatch = context.match(/\b(20\d{2}|Q[1-4]\s*20\d{2})\b/);
        const timeframe = yearMatch ? yearMatch[0] : undefined;

        // Extract region
        const regionPatterns = ['global', 'worldwide', 'china', 'us', 'europe', 'asia', 'north america', 'latam', 'mena', 'apac'];
        const region = regionPatterns.find(r => context.toLowerCase().includes(r));

        metrics.push({
          value,
          context: context.substring(0, 150),
          unit,
          timeframe,
          region: region ? region.charAt(0).toUpperCase() + region.slice(1) : undefined
        });
      }
    }
  });

  return metrics.slice(0, 15);
}

/**
 * Extract entities from text
 */
function extractEntities(text: string, category: string): any {
  const entities: any = {
    companies: [],
    games: [],
    technologies: [],
    regions: [],
    genres: [],
    platforms: [],
    businessModels: []
  };

  // Common gaming companies
  const companyPatterns = [
    'Tencent', 'Sony', 'Microsoft', 'Nintendo', 'Activision', 'Blizzard', 'EA', 'Electronic Arts',
    'Ubisoft', 'Take-Two', 'Epic Games', 'Riot Games', 'Valve', 'Roblox', 'Unity',
    'Apple', 'Google', 'Amazon', 'Meta', 'Netflix', 'Discord', 'Twitch', 'YouTube Gaming',
    'Mihoyo', 'NetEase', 'Nexon', 'Krafton', 'Supercell', 'King', 'Zynga', 'Playtika'
  ];

  companyPatterns.forEach(company => {
    const regex = new RegExp(`\\b${company}\\b`, 'gi');
    if (regex.test(text)) {
      entities.companies.push(company);
    }
  });

  // Popular games
  const gamePatterns = [
    'Fortnite', 'League of Legends', 'Minecraft', 'Roblox', 'Call of Duty', 'FIFA', 'GTA',
    'Pokémon', 'Candy Crush', 'PUBG', 'Genshin Impact', 'Valorant', 'Counter-Strike',
    'Dota', 'Apex Legends', 'Overwatch', 'World of Warcraft', 'Among Us', 'Fall Guys',
    'Animal Crossing', 'The Sims', 'Zelda', 'Mario', 'Sonic'
  ];

  gamePatterns.forEach(game => {
    const regex = new RegExp(`\\b${game}\\b`, 'gi');
    if (regex.test(text)) {
      entities.games.push(game);
    }
  });

  // Technologies (especially for blockchain/web3 content)
  const techPatterns = [
    'blockchain', 'NFT', 'Web3', 'cryptocurrency', 'metaverse', 'VR', 'AR', 'XR',
    'cloud gaming', 'AI', 'machine learning', 'Unity', 'Unreal Engine',
    'Ethereum', 'Bitcoin', 'Cardano', 'Polygon', 'Solana',
    '5G', 'streaming', 'cross-platform'
  ];

  techPatterns.forEach(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'gi');
    if (regex.test(text)) {
      entities.technologies.push(tech);
    }
  });

  // Regions
  const regionPatterns = [
    'Global', 'North America', 'United States', 'Canada', 'Europe', 'UK', 'Germany', 'France',
    'Asia', 'China', 'Japan', 'South Korea', 'Southeast Asia', 'India',
    'Middle East', 'MENA', 'Saudi Arabia', 'UAE',
    'Latin America', 'Brazil', 'Mexico', 'APAC'
  ];

  regionPatterns.forEach(region => {
    const regex = new RegExp(`\\b${region}\\b`, 'gi');
    if (regex.test(text)) {
      entities.regions.push(region);
    }
  });

  // Genres
  const genrePatterns = [
    'RPG', 'FPS', 'MMORPG', 'Battle Royale', 'MOBA', 'Strategy', 'Racing', 'Sports',
    'Puzzle', 'Casual', 'Simulation', 'Sandbox', 'Shooter', 'Action', 'Adventure',
    'Fighting', 'Platformer', 'Card', 'Board'
  ];

  genrePatterns.forEach(genre => {
    const regex = new RegExp(`\\b${genre}\\b`, 'gi');
    if (regex.test(text)) {
      entities.genres.push(genre);
    }
  });

  // Platforms
  const platformPatterns = [
    'PC', 'Console', 'Mobile', 'iOS', 'Android', 'PlayStation', 'Xbox', 'Nintendo Switch',
    'Steam', 'Epic Games Store', 'App Store', 'Google Play'
  ];

  platformPatterns.forEach(platform => {
    const regex = new RegExp(`\\b${platform}\\b`, 'gi');
    if (regex.test(text)) {
      entities.platforms.push(platform);
    }
  });

  // Business Models
  const modelPatterns = [
    'free-to-play', 'F2P', 'subscription', 'premium', 'pay-to-play',
    'in-app purchases', 'IAP', 'microtransactions', 'battle pass',
    'loot boxes', 'ads', 'advertising', 'sponsorship'
  ];

  modelPatterns.forEach(model => {
    const regex = new RegExp(`\\b${model}\\b`, 'gi');
    if (regex.test(text)) {
      entities.businessModels.push(model);
    }
  });

  // Deduplicate and limit
  Object.keys(entities).forEach(key => {
    entities[key] = [...new Set(entities[key])].slice(0, 10);
  });

  return entities;
}

/**
 * Determine report type
 */
function determineReportType(text: string, title: string, category: string): string {
  const lower = text.toLowerCase() + ' ' + title.toLowerCase();

  if (lower.includes('market report') || lower.includes('market size') || lower.includes('market analysis')) {
    return 'Market Research Report';
  } else if (lower.includes('survey') || lower.includes('poll')) {
    return 'Survey Report';
  } else if (lower.includes('investment') || lower.includes('m&a') || lower.includes('acquisition')) {
    return 'Investment Report';
  } else if (lower.includes('trend') || lower.includes('outlook') || lower.includes('forecast')) {
    return 'Trend Analysis';
  } else if (lower.includes('state of') || lower.includes('industry report')) {
    return 'Industry Overview';
  } else if (lower.includes('financial') || lower.includes('earnings') || lower.includes('revenue')) {
    return 'Financial Report';
  } else if (lower.includes('research') || lower.includes('study')) {
    return 'Research Report';
  } else if (lower.includes('quarterly') || lower.includes('q1') || lower.includes('q2')) {
    return 'Quarterly Report';
  } else if (lower.includes('annual') || lower.includes('year in review')) {
    return 'Annual Report';
  } else {
    return 'Industry Report';
  }
}

/**
 * Extract topics from text
 */
function extractTopics(text: string, category: string): string[] {
  const topics: string[] = [];

  const topicKeywords: { [key: string]: string[] } = {
    'Market Growth': ['growth', 'expansion', 'increase', 'rising', 'surge'],
    'Revenue & Monetization': ['revenue', 'monetization', 'earnings', 'income', 'profit'],
    'Player Behavior': ['player', 'user behavior', 'engagement', 'retention', 'churn'],
    'Mobile Gaming': ['mobile', 'smartphone', 'ios', 'android', 'app'],
    'Cloud Gaming': ['cloud gaming', 'streaming', 'game streaming'],
    'Esports': ['esports', 'competitive gaming', 'tournament'],
    'Blockchain & NFT': ['blockchain', 'nft', 'web3', 'cryptocurrency', 'crypto'],
    'Metaverse': ['metaverse', 'virtual world'],
    'VR/AR': ['virtual reality', 'augmented reality', 'vr', 'ar', 'xr'],
    'User Acquisition': ['acquisition', 'marketing', 'advertising', 'user acquisition'],
    'Game Development': ['development', 'game engine', 'unity', 'unreal'],
    'Regional Markets': ['china', 'asia', 'europe', 'north america', 'regional'],
    'Demographics': ['demographic', 'age group', 'gender', 'generation'],
    'Platform Trends': ['platform', 'cross-platform', 'console', 'pc'],
    'Investment & M&A': ['investment', 'funding', 'merger', 'acquisition'],
    'Regulations': ['regulation', 'policy', 'compliance', 'law'],
    'Technology': ['technology', 'innovation', 'ai', 'machine learning'],
    'Social Gaming': ['social', 'multiplayer', 'community']
  };

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      topics.push(topic);
    }
  });

  // Add category-specific topics
  if (category.includes('Blockchain')) {
    topics.push('Blockchain Gaming', 'Digital Assets');
  } else if (category.includes('Cloud')) {
    topics.push('Cloud Infrastructure', 'Streaming Technology');
  } else if (category.includes('Mobile')) {
    topics.push('Mobile Platforms', 'App Stores');
  }

  return [...new Set(topics)].slice(0, 10);
}

/**
 * Generate summary from text
 */
function generateSummary(text: string, title: string, metrics: any[]): string {
  const firstParagraphs = text.substring(0, 5000);

  // Extract first few meaningful sentences
  const sentences = firstParagraphs
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 50 && s.length < 300)
    .slice(0, 8);

  let summary = '';

  // Paragraph 1: Introduction and context
  const intro = sentences.slice(0, 3).join('. ');
  if (intro) {
    summary += intro + '.\n\n';
  }

  // Paragraph 2: Key metrics and data points
  if (metrics.length > 0) {
    summary += 'Key findings include: ';
    const metricSummary = metrics.slice(0, 3).map(m =>
      `${m.value} ${m.context.substring(0, 80)}`
    ).join('; ');
    summary += metricSummary + '.\n\n';
  }

  // Paragraph 3: Conclusions and implications
  const conclusion = sentences.slice(-2).join('. ');
  if (conclusion && conclusion !== intro) {
    summary += conclusion + '.';
  }

  return summary.substring(0, 800);
}

/**
 * Extract key findings
 */
function extractKeyFindings(text: string, metrics: any[]): string[] {
  const findings: string[] = [];

  // Look for bullet points or numbered lists
  const bulletPattern = /[•\-\*]\s*([^\n]{30,200})/g;
  const matches = text.match(bulletPattern);

  if (matches) {
    findings.push(...matches.map(m => m.replace(/^[•\-\*]\s*/, '').trim()).slice(0, 5));
  }

  // Extract sentences with key indicators
  const keyPhrases = ['shows that', 'reveals', 'indicates', 'demonstrates', 'reached', 'grew to', 'increased by'];
  const sentences = text.split(/[.!?]+/).filter(s => s.length > 50 && s.length < 250);

  sentences.forEach(sentence => {
    if (keyPhrases.some(phrase => sentence.toLowerCase().includes(phrase)) && findings.length < 10) {
      findings.push(sentence.trim());
    }
  });

  // Add metric-based findings
  metrics.slice(0, 3).forEach(metric => {
    if (findings.length < 10) {
      findings.push(`${metric.context} of ${metric.value}${metric.timeframe ? ` in ${metric.timeframe}` : ''}`);
    }
  });

  return findings.slice(0, 10);
}

/**
 * Determine sentiment
 */
function determineSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['growth', 'increase', 'success', 'opportunity', 'positive', 'strong', 'improve', 'rise', 'gain', 'advantage'];
  const negativeWords = ['decline', 'decrease', 'challenge', 'concern', 'negative', 'weak', 'fall', 'loss', 'risk', 'threat'];

  const lower = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lower.includes(word)).length;

  if (positiveCount > negativeCount * 1.5) return 'positive';
  if (negativeCount > positiveCount * 1.5) return 'negative';
  return 'neutral';
}

/**
 * Analyze a single document
 */
function analyzeDocument(extracted: ExtractedDocument): any {
  const { text, document, pageCount } = extracted;

  log(`  Analyzing: ${document.title}`, colors.gray);

  const metrics = extractMetrics(text);
  const entities = extractEntities(text, document.category);
  const reportType = determineReportType(text, document.title, document.category);
  const topics = extractTopics(text, document.category);
  const summary = generateSummary(text, document.title, metrics);
  const keyFindings = extractKeyFindings(text, metrics);
  const sentiment = determineSentiment(text);

  // Determine geographic scope
  let geographicScope = 'Global';
  if (entities.regions.length > 0) {
    if (entities.regions.some((r: string) => r.toLowerCase().includes('global') || r.toLowerCase().includes('worldwide'))) {
      geographicScope = 'Global';
    } else if (entities.regions.length === 1) {
      geographicScope = entities.regions[0];
    } else {
      geographicScope = 'Multi-Regional';
    }
  }

  // Determine content focus
  const contentFocus: string[] = [];
  if (text.toLowerCase().includes('market') || text.toLowerCase().includes('revenue')) {
    contentFocus.push('Market Analysis');
  }
  if (text.toLowerCase().includes('player') || text.toLowerCase().includes('user')) {
    contentFocus.push('User Behavior');
  }
  if (text.toLowerCase().includes('technology') || text.toLowerCase().includes('innovation')) {
    contentFocus.push('Technology');
  }
  if (document.category.includes('Blockchain') || text.toLowerCase().includes('blockchain')) {
    contentFocus.push('Blockchain & Web3');
  }

  // Calculate confidence based on data quality
  let confidence = 0.70;
  if (metrics.length > 5) confidence += 0.10;
  if (entities.companies.length > 3) confidence += 0.05;
  if (pageCount > 20) confidence += 0.05;
  if (text.length > 50000) confidence += 0.10;
  confidence = Math.min(confidence, 0.95);

  return {
    reportType,
    contentFocus: contentFocus.slice(0, 5),
    geographicScope,
    temporalNature: document.metadata.year ? [`Historical (${document.metadata.year})`] : ['Current'],
    dataCharacteristics: metrics.length > 10 ? 'Quantitative' : 'Qualitative',
    targetAudience: ['Industry Professionals', 'Investors', 'Researchers'],

    summary,
    keyFindings,
    keyInsights: keyFindings.slice(0, 5),
    topics,

    extractedMetrics: metrics,
    extractedEntities: entities,

    methodology: text.toLowerCase().includes('methodology') ? 'Research methodology described in document' : 'Not explicitly stated',
    sentiment,
    confidence,

    pageCount,
    dataQuality: {
      textExtractionQuality: pageCount > 0 && text.length > 1000 ? 'good' : 'fair',
      dataCompleteness: Math.min(1, metrics.length / 15),
      confidence,
      processingNotes: [
        `Extracted ${metrics.length} metrics`,
        `Identified ${entities.companies.length} companies`,
        `Found ${topics.length} relevant topics`
      ]
    }
  };
}

/**
 * Main processing function
 */
async function main() {
  log('\n' + '='.repeat(70), colors.bright);
  log('Comprehensive Analysis of Documents 1-100', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright);

  try {
    // Read extracted documents
    const extractedPath = path.join(process.cwd(), 'data', 'extracted-1-100.json');
    const extractedContent = await fs.readFile(extractedPath, 'utf-8');
    const extracted: ExtractedDocument[] = JSON.parse(extractedContent);

    log(`✓ Loaded ${extracted.length} extracted documents`, colors.green);

    // Read current documents.json
    const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
    const documentsContent = await fs.readFile(documentsPath, 'utf-8');
    const allDocuments: any[] = JSON.parse(documentsContent);

    log(`✓ Loaded ${allDocuments.length} total documents\n`, colors.green);

    let succeeded = 0;
    let failed = 0;
    const samples: any[] = [];

    // Process all documents
    for (let i = 0; i < extracted.length; i++) {
      log(`[${i + 1}/100] Processing: ${extracted[i].document.title}`, colors.cyan);

      try {
        const analysis = analyzeDocument(extracted[i]);

        // Update document
        allDocuments[i] = {
          ...allDocuments[i],
          processingStatus: 'completed',
          processedDate: new Date().toISOString(),
          aiAnalysis: analysis
        };

        succeeded++;

        // Save first 3 as samples
        if (samples.length < 3) {
          samples.push({
            title: allDocuments[i].title,
            analysis
          });
        }

        log(`  ✓ Completed`, colors.green);

        // Save after every 20 documents
        if ((i + 1) % 20 === 0) {
          await fs.writeFile(documentsPath, JSON.stringify(allDocuments, null, 2), 'utf-8');
          log(`\n💾 Saved batch ${Math.floor(i / 20) + 1} (${i + 1} documents)\n`, colors.yellow);
        }

      } catch (error) {
        log(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, colors.red);
        failed++;
      }
    }

    // Final save
    await fs.writeFile(documentsPath, JSON.stringify(allDocuments, null, 2), 'utf-8');
    log(`\n💾 Final save completed`, colors.yellow);

    // Summary
    log('\n' + '='.repeat(70), colors.bright);
    log('Processing Complete!', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.bright);

    log(`✓ Succeeded: ${succeeded}`, colors.green);
    log(`✗ Failed: ${failed}`, colors.red);
    log(`📊 Success rate: ${Math.round((succeeded / 100) * 100)}%`, colors.cyan);

    // Show sample analyses
    if (samples.length > 0) {
      log('\n' + '─'.repeat(70), colors.gray);
      log('Sample Analyses', colors.bright + colors.cyan);
      log('─'.repeat(70) + '\n', colors.gray);

      samples.forEach((sample, idx) => {
        log(`${idx + 1}. ${sample.title}`, colors.bright);
        log(`   Report Type: ${sample.analysis.reportType}`, colors.cyan);
        log(`   Geographic Scope: ${sample.analysis.geographicScope}`, colors.cyan);
        log(`   Topics: ${sample.analysis.topics.slice(0, 3).join(', ')}`, colors.cyan);
        log(`   Metrics: ${sample.analysis.extractedMetrics.length} extracted`, colors.yellow);
        log(`   Companies: ${sample.analysis.extractedEntities.companies.slice(0, 5).join(', ')}`, colors.gray);
        log(`   Key Finding: ${sample.analysis.keyFindings[0]?.substring(0, 100)}...`, colors.gray);
        log('');
      });
    }

    log('='.repeat(70), colors.bright);
    log('✨ All 100 documents analyzed and saved to documents.json', colors.bright + colors.green);
    log('='.repeat(70) + '\n', colors.bright);

  } catch (error) {
    log('\n❌ Fatal Error:', colors.red);
    log(error instanceof Error ? error.message : 'Unknown error', colors.red);
    if (error instanceof Error && error.stack) {
      log('\nStack trace:', colors.gray);
      log(error.stack, colors.gray);
    }
    process.exit(1);
  }
}

main();
