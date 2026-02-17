/**
 * Ranking Algorithm for News Radar
 * Combines recency, source authority, and keyword relevance
 */

import { SOURCE_AUTHORITY, DEFAULT_AUTHORITY, KEYWORDS } from './sources.js';

/**
 * Calculate recency score based on publication date
 * Today = 100, Yesterday = 70, 2 days = 40, 3 days = 20
 */
export function calculateRecencyScore(pubDate) {
  const now = new Date();
  const published = new Date(pubDate);
  const diffMs = now - published;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  if (diffHours < 6) return 100;      // Last 6 hours - maximum freshness
  if (diffHours < 12) return 95;      // Last 12 hours
  if (diffHours < 24) return 90;      // Today (older)
  if (diffDays < 2) return 70;        // Yesterday
  if (diffDays < 3) return 40;        // 2 days ago
  if (diffDays <= 3) return 20;       // 3 days ago
  return 0;                           // Older than 3 days
}

/**
 * Get source authority score from domain
 */
export function getAuthorityScore(domain) {
  // Normalize domain (remove www, etc.)
  const normalized = domain.replace(/^www\./, '').toLowerCase();
  
  // Check direct match
  if (SOURCE_AUTHORITY[normalized]) {
    return SOURCE_AUTHORITY[normalized];
  }
  
  // Check if subdomain matches a known domain
  for (const knownDomain of Object.keys(SOURCE_AUTHORITY)) {
    if (normalized.endsWith(knownDomain)) {
      return SOURCE_AUTHORITY[knownDomain];
    }
  }
  
  return DEFAULT_AUTHORITY;
}

/**
 * Calculate keyword relevance score
 * Returns score and detected category
 */
export function calculateKeywordScore(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  let aiScore = 0;
  let fraudScore = 0;
  
  // Check AI keywords
  for (const keyword of KEYWORDS.ai.primary) {
    if (text.includes(keyword.toLowerCase())) {
      aiScore += 50;
    }
  }
  for (const keyword of KEYWORDS.ai.secondary) {
    if (text.includes(keyword.toLowerCase())) {
      aiScore += 20;
    }
  }
  
  // Check Fraud keywords
  for (const keyword of KEYWORDS.fraud.primary) {
    if (text.includes(keyword.toLowerCase())) {
      fraudScore += 50;
    }
  }
  for (const keyword of KEYWORDS.fraud.secondary) {
    if (text.includes(keyword.toLowerCase())) {
      fraudScore += 20;
    }
  }
  
  // Normalize scores (cap at 100)
  aiScore = Math.min(aiScore, 100);
  fraudScore = Math.min(fraudScore, 100);
  
  // Determine primary category
  let category = 'general';
  if (aiScore > fraudScore && aiScore > 30) {
    category = 'ai';
  } else if (fraudScore > aiScore && fraudScore > 30) {
    category = 'fraud';
  } else if (aiScore > 30 && fraudScore > 30) {
    category = 'both';
  } else if (aiScore > 20) {
    category = 'ai';
  } else if (fraudScore > 20) {
    category = 'fraud';
  }
  
  return {
    score: Math.max(aiScore, fraudScore),
    aiScore,
    fraudScore,
    category
  };
}

/**
 * Calculate final ranking score for a news item
 */
export function calculateRankingScore(newsItem) {
  const recencyScore = calculateRecencyScore(newsItem.pubDate);
  const authorityScore = getAuthorityScore(newsItem.domain || '');
  const keywordResult = calculateKeywordScore(newsItem.title, newsItem.description);
  
  // Weighted combination
  const weights = {
    recency: 0.40,
    authority: 0.30,
    keyword: 0.30
  };
  
  const finalScore = 
    (recencyScore * weights.recency) +
    (authorityScore * weights.authority) +
    (keywordResult.score * weights.keyword);
  
  return {
    finalScore: Math.round(finalScore * 10) / 10,
    recencyScore,
    authorityScore,
    keywordScore: keywordResult.score,
    category: keywordResult.category,
    aiScore: keywordResult.aiScore,
    fraudScore: keywordResult.fraudScore
  };
}

/**
 * Rank and sort news items
 */
export function rankNews(newsItems) {
  // Calculate scores for all items
  const scoredItems = newsItems.map(item => {
    const scores = calculateRankingScore(item);
    return {
      ...item,
      ...scores
    };
  });
  
  // Sort by final score (descending)
  scoredItems.sort((a, b) => b.finalScore - a.finalScore);
  
  return scoredItems;
}

/**
 * Separate into "Top" and "More" news
 */
export function categorizeNews(rankedNews, topCount = 5) {
  const top = rankedNews.slice(0, topCount);
  const more = rankedNews.slice(topCount);
  
  return { top, more };
}

/**
 * Filter news by category
 */
export function filterByCategory(news, category) {
  if (category === 'all') return news;
  
  return news.filter(item => {
    if (category === 'ai') {
      return item.category === 'ai' || item.category === 'both';
    }
    if (category === 'fraud') {
      return item.category === 'fraud' || item.category === 'both';
    }
    return true;
  });
}
