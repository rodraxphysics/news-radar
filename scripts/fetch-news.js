#!/usr/bin/env node
/**
 * News Radar - Main Fetcher Script
 * Fetches news from multiple sources, ranks them, and generates output
 */

import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { 
  TRUSTED_DOMAINS, 
  RSS_FEEDS, 
  GOOGLE_NEWS_QUERIES, 
  NEWSAPI_CONFIG,
  TIME_CONFIG 
} from './sources.js';
import { rankNews, categorizeNews } from './ranking.js';
import { generateSummary } from './summary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'NewsRadar/1.0 (https://github.com/news-radar)'
  }
});

// Environment variables
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Check if domain is in whitelist
 */
function isWhitelisted(url) {
  const domain = extractDomain(url);
  if (!domain) return false;
  
  return TRUSTED_DOMAINS.some(trusted => 
    domain === trusted || domain.endsWith('.' + trusted)
  );
}

/**
 * Check if article is within time window
 */
function isWithinTimeWindow(pubDate) {
  const published = new Date(pubDate);
  const now = new Date();
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays <= TIME_CONFIG.windowDays;
}

/**
 * Fetch and parse an RSS feed
 */
async function fetchRSSFeed(feedConfig) {
  try {
    console.log(`  Fetching: ${feedConfig.source || feedConfig.url}`);
    const feed = await parser.parseURL(feedConfig.url);
    
    return feed.items
      .filter(item => item.link && item.title)
      .map(item => ({
        title: item.title?.trim() || '',
        link: item.link,
        description: item.contentSnippet?.trim() || item.content?.trim() || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: feedConfig.source || feed.title || 'Unknown',
        domain: feedConfig.domain || extractDomain(item.link)
      }));
  } catch (error) {
    console.error(`  ✗ Error fetching ${feedConfig.url}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(query, category) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
  
  try {
    console.log(`  Google News: "${query}"`);
    const feed = await parser.parseURL(url);
    
    return feed.items
      .filter(item => item.link && item.title)
      .map(item => {
        // Google News links redirect - extract actual source from title
        const sourceMatch = item.title?.match(/\s-\s([^-]+)$/);
        const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';
        const title = sourceMatch 
          ? item.title.replace(/\s-\s[^-]+$/, '').trim() 
          : item.title;
        
        return {
          title,
          link: item.link,
          description: item.contentSnippet?.trim() || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source,
          domain: extractDomain(item.link),
          googleNewsCategory: category
        };
      });
  } catch (error) {
    console.error(`  ✗ Google News error for "${query}": ${error.message}`);
    return [];
  }
}

/**
 * Fetch news from NewsAPI (if key available)
 */
async function fetchNewsAPI(query, category) {
  if (!NEWSAPI_KEY) {
    return [];
  }
  
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - TIME_CONFIG.windowDays);
  
  const params = new URLSearchParams({
    q: query,
    from: fromDate.toISOString().split('T')[0],
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: '50',
    apiKey: NEWSAPI_KEY
  });
  
  if (NEWSAPI_CONFIG.domains) {
    params.append('domains', NEWSAPI_CONFIG.domains);
  }
  
  try {
    console.log(`  NewsAPI: ${category}`);
    const response = await fetch(`${NEWSAPI_CONFIG.baseUrl}/everything?${params}`);
    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.error(`  ✗ NewsAPI error: ${data.message || 'Unknown error'}`);
      return [];
    }
    
    return (data.articles || []).map(article => ({
      title: article.title?.trim() || '',
      link: article.url,
      description: article.description?.trim() || '',
      pubDate: article.publishedAt,
      source: article.source?.name || 'Unknown',
      domain: extractDomain(article.url),
      imageUrl: article.urlToImage
    }));
  } catch (error) {
    console.error(`  ✗ NewsAPI error: ${error.message}`);
    return [];
  }
}

/**
 * Deduplicate news by URL and similar titles
 */
function deduplicateNews(news) {
  const seen = new Map();
  const seenTitles = new Set();
  
  return news.filter(item => {
    // Dedupe by URL
    if (seen.has(item.link)) {
      return false;
    }
    
    // Dedupe by similar title (first 50 chars, normalized)
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seenTitles.has(normalizedTitle)) {
      return false;
    }
    
    seen.set(item.link, true);
    seenTitles.add(normalizedTitle);
    return true;
  });
}

/**
 * Main fetch function
 */
async function fetchAllNews() {
  console.log('\n📡 News Radar - Fetching News\n');
  console.log(`Time window: Last ${TIME_CONFIG.windowDays} days`);
  console.log(`NewsAPI: ${NEWSAPI_KEY ? '✓ Configured' : '✗ Not configured (using RSS only)'}`);
  console.log(`OpenAI: ${OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured (using extractive summary)'}`);
  console.log('');
  
  let allNews = [];
  
  // 1. Fetch from direct RSS feeds
  console.log('📰 Fetching RSS feeds...');
  for (const category of ['ai', 'fraud', 'general']) {
    const feeds = RSS_FEEDS[category] || [];
    for (const feed of feeds) {
      const items = await fetchRSSFeed(feed);
      allNews.push(...items);
    }
  }
  
  // 2. Fetch from Google News
  console.log('\n🔍 Fetching Google News...');
  for (const [category, queries] of Object.entries(GOOGLE_NEWS_QUERIES)) {
    for (const query of queries) {
      const items = await fetchGoogleNews(query, category);
      allNews.push(...items);
      // Small delay to be nice to Google
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // 3. Fetch from NewsAPI (if available)
  if (NEWSAPI_KEY) {
    console.log('\n📡 Fetching NewsAPI...');
    for (const [category, query] of Object.entries(NEWSAPI_CONFIG.queries)) {
      const items = await fetchNewsAPI(query, category);
      allNews.push(...items);
    }
  }
  
  console.log(`\n📊 Raw articles fetched: ${allNews.length}`);
  
  // 4. Filter by whitelist
  const whitelisted = allNews.filter(item => isWhitelisted(item.link));
  console.log(`📋 After whitelist filter: ${whitelisted.length}`);
  
  // 5. Filter by time window
  const recent = whitelisted.filter(item => isWithinTimeWindow(item.pubDate));
  console.log(`📅 Within ${TIME_CONFIG.windowDays}-day window: ${recent.length}`);
  
  // 6. Deduplicate
  const unique = deduplicateNews(recent);
  console.log(`🔄 After deduplication: ${unique.length}`);
  
  // 7. Rank news
  console.log('\n🏆 Ranking articles...');
  const ranked = rankNews(unique);
  
  // 8. Categorize into top and more
  const { top, more } = categorizeNews(ranked, 6);
  
  // 9. Generate summary
  console.log('\n📝 Generating executive summary...');
  const summary = await generateSummary(ranked, OPENAI_API_KEY);
  
  // 10. Build output
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      timezone: TIME_CONFIG.timezone,
      windowDays: TIME_CONFIG.windowDays,
      totalArticles: ranked.length,
      sources: [...new Set(ranked.map(n => n.source))].length,
      hasNewsAPI: !!NEWSAPI_KEY,
      hasOpenAI: !!OPENAI_API_KEY
    },
    summary,
    top: top.map(formatNewsItem),
    more: more.map(formatNewsItem),
    all: ranked.map(formatNewsItem)
  };
  
  return output;
}

/**
 * Format news item for output
 */
function formatNewsItem(item) {
  return {
    title: item.title,
    link: item.link,
    description: truncate(item.description, 200),
    source: item.source,
    domain: item.domain,
    pubDate: item.pubDate,
    category: item.category,
    score: item.finalScore,
    imageUrl: item.imageUrl || null
  };
}

/**
 * Truncate text to max length
 */
function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Main entry point
 */
async function main() {
  try {
    const output = await fetchAllNews();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    console.log(`Total articles: ${output.metadata.totalArticles}`);
    console.log(`Sources: ${output.metadata.sources}`);
    console.log(`Top stories: ${output.top.length}`);
    console.log(`More stories: ${output.more.length}`);
    console.log('');
    
    // Category breakdown
    const aiCount = output.all.filter(n => n.category === 'ai' || n.category === 'both').length;
    const fraudCount = output.all.filter(n => n.category === 'fraud' || n.category === 'both').length;
    console.log(`AI articles: ${aiCount}`);
    console.log(`Fraud articles: ${fraudCount}`);
    
    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN - Not writing files');
      console.log('\nTop stories:');
      output.top.forEach((item, i) => {
        console.log(`  ${i + 1}. [${item.category}] ${item.title}`);
        console.log(`     ${item.source} | Score: ${item.score}`);
      });
      return;
    }
    
    // Write output
    const outputDir = join(__dirname, '..', 'docs', 'data');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = join(outputDir, 'news.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Output written to: ${outputPath}`);
    console.log(`   File size: ${(JSON.stringify(output).length / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
