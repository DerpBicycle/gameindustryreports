# AI Processing Implementation Guide
## Game Industry Reports Collection

**Quick Reference for Development Team**

---

## Document Type Detection (Classification Model)

### Input Features:
- First 5 pages of text
- Table of contents (if present)
- Word frequency patterns
- Document structure signals

### Classification Labels:

#### Primary Type (6 classes):
1. **Market Research** - Keywords: "market sizing", "forecast", "TAM", "methodology", "consumer insights"
2. **Financial Reports** - Keywords: "investment", "M&A", "deal", "valuation", "VC", "Series A/B/C"
3. **Trend Analysis** - Keywords: "trends to watch", "predictions", "will", "expected to", "future of"
4. **Performance Analytics** - Keywords: "installs", "sessions", "retention", "eCPI", "DAU", "MAU"
5. **Research Studies** - Keywords: "survey", "respondents", "methodology", "sample size", "findings"
6. **Practical Guides** - Keywords: "best practices", "how to", "guide", "tips", "strategies"

#### Secondary Labels:
- Data Intensity: low/medium/high/very_high
- Geographic Scope: global/regional/country/multi-regional
- Temporal Nature: historical/current/future/periodic

---

## Extraction Patterns by Document Type

### Market Research Reports

**Priority Extractions:**
```javascript
{
  market_name: STRING,
  geography: STRING,
  year: INTEGER,
  revenue: {
    value: FLOAT,
    unit: STRING, // "million USD", "billion USD"
    scenario: STRING, // "base", "optimistic", "pessimistic"
    growth_yoy: STRING // "+15%", "-3%"
  },
  users: {
    total: INTEGER,
    paying: INTEGER,
    unit: STRING // "million", "billion"
  },
  forecasts: [
    {
      year: INTEGER,
      metric: STRING,
      value: FLOAT,
      scenario: STRING
    }
  ],
  methodology: {
    sample_size: INTEGER,
    countries: INTEGER,
    date_range: STRING,
    approach: STRING
  },
  source_page: INTEGER,
  confidence: FLOAT
}
```

**Regex Patterns:**
- Revenue: `/\$?(\d+\.?\d*)\s*(billion|million|B|M)\s*(USD|dollars)?/i`
- Users: `/(\d+\.?\d*)\s*(million|billion|M|B)\s*(users|players|gamers)/i`
- Growth: `/([\+\-]\d+\.?\d*)%\s*(YoY|year-over-year|annually)/i`
- Forecast: `/by (\d{4}).*?(\d+\.?\d*)\s*(billion|million)/i`

---

### Investment Reports

**Priority Extractions:**
```javascript
{
  period: STRING, // "Q2 2024", "FY2023"
  deals: [
    {
      company: STRING,
      deal_type: STRING, // "Series A", "M&A", "IPO"
      amount: FLOAT,
      currency: STRING,
      investors: [STRING],
      sector: STRING,
      geography: STRING,
      date: DATE
    }
  ],
  aggregates: {
    total_amount: FLOAT,
    deal_count: INTEGER,
    avg_deal_size: FLOAT,
    change_yoy: STRING
  },
  active_vcs: [
    {
      name: STRING,
      deal_count: INTEGER,
      total_invested: FLOAT
    }
  ]
}
```

**Entity Recognition:**
- Company names: NER model + validation against known companies
- Deal types: "Series A", "Series B", "Seed", "M&A", "Acquisition", "IPO", "PIPE"
- Investors: VC fund names, corporate VCs
- Amounts: Parse "$25M", "$1.2B", "undisclosed"

---

### Survey Reports

**Priority Extractions:**
```javascript
{
  study_name: STRING,
  methodology: {
    sample_size: INTEGER,
    countries: INTEGER || [STRING],
    date_range: STRING,
    target_audience: STRING,
    survey_method: STRING
  },
  demographics: {
    gender: {male: FLOAT, female: FLOAT, other: FLOAT},
    age_groups: {range: STRING, percentage: FLOAT},
    geography: {country: STRING, count: INTEGER}
  },
  key_findings: [
    {
      finding: STRING,
      metric: STRING,
      value: FLOAT,
      unit: STRING,
      significance: STRING,
      context: STRING
    }
  ],
  correlations: [
    {
      variable_a: STRING,
      variable_b: STRING,
      relationship: STRING,
      strength: FLOAT
    }
  ]
}
```

**Detection Patterns:**
- Sample size: `/(\d+[\d,]*)\s*(respondents|participants|survey|people|professionals)/i`
- Countries: `/(\d+)\s*countries/i` or extract country list
- Demographics: `/(\d+)%\s*(male|female|aged \d+-\d+)/i`
- Findings: Sentences containing percentages + context

---

## Named Entity Recognition (NER)

### Custom Gaming Entities:

#### COMPANY (Game Companies)
**Training examples:**
- Publishers: "Electronic Arts", "Activision Blizzard", "Tencent", "Sony Interactive Entertainment"
- Developers: "Epic Games", "Riot Games", "miHoYo", "Supercell"
- Platforms: "Steam", "Xbox", "PlayStation", "Nintendo"
- Tech: "Unity", "Unreal Engine", "AWS"

#### GAME (Game Titles)
**Training examples:**
- "Fortnite", "League of Legends", "Genshin Impact", "Call of Duty", "Minecraft"
- Watch for: italics, quotes, capitalization patterns
- Disambiguation: "Valorant the game" vs "valorant approach"

#### TECHNOLOGY
**Training examples:**
- "Cloud Gaming", "5G", "VR", "AR", "Blockchain", "NFT", "Metaverse", "AI"
- "Unreal Engine 5", "Unity", "Game Pass", "GeForce NOW"

#### METRIC
**Training examples:**
- "DAU" (Daily Active Users), "MAU", "ARPU", "LTV", "CAC", "eCPI"
- "install rate", "retention rate", "conversion rate"
- "revenue", "market size", "TAM", "SOM"

#### GEOGRAPHY
**Standard:** + Gaming-specific regions
- "APAC", "EMEA", "LATAM", "SEA" (Southeast Asia)
- "Western markets", "Emerging markets"

#### PERSON (Industry Figures)
**Training examples:**
- CEOs, founders, analysts
- "Tim Sweeney" (Epic), "Phil Spencer" (Xbox), "Satya Nadella" (Microsoft)

#### EVENT
**Training examples:**
- Game releases: "Elden Ring launch", "Diablo Immortal release"
- Conferences: "GDC", "E3", "Gamescom", "TGS"
- Esports: "League of Legends World Championship", "The International"

---

## Data Extraction Rules

### Numeric Data with Context

**Rule 1: Always extract surrounding context**
```
Bad: revenue = 2.4
Good: {
  metric: "cloud gaming revenue",
  value: 2.4,
  unit: "billion USD",
  year: 2022,
  geography: "Global",
  scenario: "base case",
  source: "Newzoo",
  context_text: "Global cloud gaming revenues in 2022 (base scenario) are expected to reach $2.4Bn"
}
```

**Rule 2: Preserve qualifiers**
- "projected", "estimated", "actual", "reported", "expected"
- These affect confidence scores

**Rule 3: Link related metrics**
```javascript
{
  metric_group: "cloud_gaming_2022",
  metrics: [
    {metric: "revenue", value: 2.4, unit: "billion USD"},
    {metric: "paying_users", value: 31.7, unit: "million"},
    {metric: "ARPPU", value: 75.71, unit: "USD", derived: true}
  ]
}
```

### Handling Ambiguity

**Scenario 1: Multiple values for same metric**
```javascript
{
  metric: "cloud gaming revenue 2022",
  values: [
    {value: 2.4, source: "Newzoo", scenario: "base", confidence: 0.9},
    {value: 3.1, source: "Newzoo", scenario: "optimistic", confidence: 0.9},
    {value: 2.1, source: "Newzoo", scenario: "pessimistic", confidence: 0.9}
  ],
  resolution: "multiple_scenarios"
}
```

**Scenario 2: Conflicting sources**
```javascript
{
  metric: "mobile gaming revenue APAC 2021",
  values: [
    {value: 45.2, source: "Newzoo", confidence: 0.85},
    {value: 48.7, source: "Adjust", confidence: 0.80}
  ],
  resolution: "conflicting_sources",
  suggested_range: {min: 45.2, max: 48.7, median: 47.0}
}
```

---

## Confidence Scoring

### Confidence Levels:

**0.95-1.0 (Very High):**
- Explicitly stated in table or highlighted section
- Clear units and context
- Primary data (not derived)
- Recent publication date

**0.85-0.94 (High):**
- Clearly stated in text
- Context provided
- May be secondary source
- Published within 2 years

**0.70-0.84 (Medium):**
- Implied from context
- Units inferred
- Older publication (2-4 years)
- Derived calculation

**0.50-0.69 (Low):**
- Requires interpretation
- Ambiguous context
- Very old (>4 years)
- Multiple assumptions needed

**<0.50 (Very Low):**
- Highly uncertain
- Flag for manual review

### Factors that Reduce Confidence:
- Missing units (-0.1)
- No date/period (-0.15)
- No geography (-0.1)
- Unclear source (-0.1)
- Derived/calculated (-0.05)
- Old publication (-0.05 per year)

---

## Chart-to-Data Extraction

### Chart Types & Strategies:

#### Line Chart
**Extract:**
- X-axis labels (usually time: years, quarters)
- Y-axis labels (metric + unit)
- Data series (each line)
- Legend (series names)

**Approach:**
1. OCR the chart image
2. Detect axis lines (computer vision)
3. Identify data points
4. Extract values at each point
5. Validate against any text mentions

#### Bar Chart
**Extract:**
- Categories (X-axis)
- Values (Y-axis)
- Grouped bars (different colors/patterns)
- Legend

#### Pie Chart
**Extract:**
- Segment labels
- Percentage values
- Total if shown

#### Table
**Extract:**
- Headers (column names)
- Row labels
- All cell values
- Units (often in header or title)

**Tool recommendation:**
- Use Camelot or Tabula for tables
- Use GPT-4V for complex charts
- Validate extracted data against text

---

## Validation Rules

### Sanity Checks:

**Revenue:**
- Must be positive
- Gaming market revenue for a country can't exceed GDP
- YoY growth >1000% should be flagged
- Unit consistency (M vs B)

**Users:**
- Can't exceed population
- Can't exceed internet users
- Mobile users ≤ total gaming users
- Paying users ≤ total users

**Percentages:**
- Must be 0-100%
- Segments should sum to ~100% (±5% for rounding)
- Retention rates: Day 1 > Day 7 > Day 30

**Dates:**
- Publication date ≥ data date
- No future dates for historical data
- Fiscal years: check company-specific definitions

**Growth Rates:**
- Large negative growth (-50%+) should be verified
- Consistent time periods for comparison

### Cross-Validation:

**Check 1: Internal consistency**
- If revenue and users both given, calculate ARPU and validate
- Sum of regional revenues ≈ global revenue
- Percentages in demographics sum to 100%

**Check 2: External consistency**
- Compare with other reports on same topic
- Flag if values differ by >30%
- Note methodology differences

**Check 3: Temporal consistency**
- 2022 revenue > 2021 revenue (if growth market)
- Forecasts should align with historical trends

---

## Query Understanding

### Query Intent Classification:

**1. Fact Lookup**
"What was mobile gaming revenue in 2022?"
- Intent: retrieve_fact
- Entities: [metric: "mobile gaming revenue", year: 2022]
- Action: Search for exact match → return value + source

**2. Comparison**
"Compare cloud gaming growth between 2021 and 2022"
- Intent: compare
- Entities: [metric: "cloud gaming growth", years: [2021, 2022]]
- Action: Retrieve both values → calculate difference → present comparison

**3. Trend Analysis**
"How has esports viewership changed over time?"
- Intent: trend_analysis
- Entities: [metric: "esports viewership", temporal: "over time"]
- Action: Retrieve time series → identify trend → visualize

**4. Aggregation**
"Total investment in gaming in Q1 2024"
- Intent: aggregate
- Entities: [operation: "sum", metric: "investment", period: "Q1 2024"]
- Action: Find all deals → sum amounts → return total

**5. Recommendation**
"What reports cover cloud gaming?"
- Intent: document_search
- Entities: [topic: "cloud gaming"]
- Action: Search documents → rank by relevance → return list

**6. Explanation**
"Why is APAC the largest mobile gaming market?"
- Intent: explain
- Entities: [fact: "APAC largest mobile market", question_type: "why"]
- Action: Retrieve supporting facts → synthesize explanation

### Entity Resolution:

**Normalize variations:**
- "mobile gaming revenue" = "mobile game revenue" = "mobile games revenue"
- "Q1 2024" = "first quarter 2024" = "January-March 2024"
- "APAC" = "Asia-Pacific" = "Asia Pacific region"

**Handle abbreviations:**
- Build abbreviation dictionary
- Context-aware expansion
- Preserve original + add normalized form

---

## Insight Generation Templates

### Template 1: Market Overview
```
**{Market Name} Market Overview**

**Market Size (${Year}):** ${Revenue} (${Geography})
**Growth:** ${YoY_Growth} YoY
**Users:** ${Total_Users} (${Paying_Users} paying)

**Key Trends:**
- ${Trend_1}
- ${Trend_2}
- ${Trend_3}

**Forecasts:**
${Year+1}: ${Forecast_1}
${Year+2}: ${Forecast_2}

**Sources:** ${Source_List}
```

### Template 2: Company Activity
```
**{Company} - Industry Activity Summary**

**Recent Investments:**
- ${Investment_1}: $${Amount}, ${Date}
- ${Investment_2}: $${Amount}, ${Date}

**Product Launches:**
- ${Product_1}, ${Date}
- ${Product_2}, ${Date}

**Market Position:**
${Position_Analysis}

**Mentions:** ${Mention_Count} across ${Document_Count} reports

**Sources:** ${Source_List}
```

### Template 3: Trend Report
```
**{Trend Name} - Trend Analysis**

**First Mentioned:** ${First_Date} by ${First_Source}
**Frequency:** Mentioned in ${Percentage}% of recent reports

**Sentiment Evolution:**
- ${Year_1}: ${Sentiment_1}
- ${Year_2}: ${Sentiment_2}
- ${Year_3}: ${Sentiment_3}

**Key Predictions:**
- ${Prediction_1} (${Source}, ${Date})
- ${Prediction_2} (${Source}, ${Date})

**Status:** ${Current_Status}
**Outlook:** ${Future_Outlook}
```

### Template 4: Regional Comparison
```
**{Metric} - Regional Comparison (${Year})**

| Region | Value | % of Total | YoY Growth |
|--------|-------|------------|------------|
| ${Region_1} | ${Value_1} | ${Pct_1} | ${Growth_1} |
| ${Region_2} | ${Value_2} | ${Pct_2} | ${Growth_2} |
| ${Region_3} | ${Value_3} | ${Pct_3} | ${Growth_3} |

**Key Insights:**
- ${Insight_1}
- ${Insight_2}

**Sources:** ${Source_List}
```

---

## API Response Format

### Standard Response:
```javascript
{
  query: STRING, // original user query
  intent: STRING, // classified intent
  results: [
    {
      type: STRING, // "fact", "document", "insight"
      data: OBJECT, // varies by type
      confidence: FLOAT,
      sources: [
        {
          document: STRING,
          page: INTEGER,
          excerpt: STRING,
          reliability_score: FLOAT
        }
      ]
    }
  ],
  metadata: {
    processing_time_ms: INTEGER,
    documents_searched: INTEGER,
    total_results: INTEGER,
    filters_applied: OBJECT
  }
}
```

### Error Response:
```javascript
{
  error: {
    code: STRING,
    message: STRING,
    suggestions: [STRING]
  }
}
```

---

## Performance Optimization

### Caching Strategy:

**Level 1: Document Cache**
- Cache parsed PDFs (text + structure)
- TTL: Permanent (documents don't change)
- Key: document_id

**Level 2: Extraction Cache**
- Cache extracted entities and metrics
- TTL: Until reprocessing triggered
- Key: document_id + extraction_version

**Level 3: Query Cache**
- Cache query results
- TTL: 1 hour
- Key: query_hash + filters

**Level 4: Insight Cache**
- Cache generated insights
- TTL: 24 hours
- Key: insight_template + parameters

### Indexing Strategy:

**Full-text index:** All document text
**Metadata index:** Category, year, source, type
**Vector index:** Semantic embeddings of paragraphs
**Entity index:** All extracted entities
**Metric index:** All numeric data

---

## Testing & QA

### Unit Tests:

**Text Extraction:**
- Test on 10 diverse PDFs
- Verify page count, text length
- Check special character handling

**Classification:**
- Test set: 100 documents with manual labels
- Target accuracy: >85%
- Confusion matrix analysis

**Entity Recognition:**
- Test set: 1000 sentences
- Precision >0.90, Recall >0.85
- F1 score >0.87

**Data Extraction:**
- Test revenue extraction on 50 examples
- Verify unit parsing (M vs B)
- Check context preservation

### Integration Tests:

**End-to-end query:**
1. Submit query
2. Verify intent classification
3. Check document retrieval
4. Validate answer extraction
5. Verify source attribution

**Cross-document:**
- Query spanning multiple documents
- Verify aggregation logic
- Check conflict resolution

### Manual QA:

**Sample 10 random documents:**
- Review extractions
- Verify accuracy
- Check edge cases
- Document issues

**User testing:**
- 20 test queries
- Measure satisfaction
- Collect feedback
- Iterate on failures

---

## Monitoring & Logging

### Key Metrics to Track:

**Processing:**
- Documents processed per day
- Average processing time
- Error rate
- Confidence score distribution

**Usage:**
- Queries per day
- Query types distribution
- Response time
- Cache hit rate

**Quality:**
- Extraction accuracy (spot checks)
- User feedback (thumbs up/down)
- Manual corrections needed
- False positive rate

### Logging:

**Log every:**
- Query (sanitized)
- Document processing
- Extraction with confidence
- Error with stack trace
- User feedback

**Retention:**
- Error logs: 90 days
- Query logs: 30 days
- Processing logs: 7 days

---

## Deployment Checklist

### Pre-launch:
- [ ] Process all 429 documents
- [ ] Validate 10% random sample
- [ ] Set up monitoring
- [ ] Load test API
- [ ] Security audit
- [ ] Backup procedures

### Launch:
- [ ] Deploy to production
- [ ] Enable monitoring
- [ ] Test with real users
- [ ] Collect feedback
- [ ] Monitor error rates

### Post-launch:
- [ ] Weekly quality reviews
- [ ] Monthly accuracy audits
- [ ] Quarterly model retraining
- [ ] Continuous improvement

---

**Version:** 1.0
**Last Updated:** 2025-11-10
**Maintained by:** Development Team
