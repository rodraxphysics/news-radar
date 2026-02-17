/**
 * Executive Summary Generator for News Radar
 * Supports both extractive (no API) and AI-powered (OpenAI) summaries
 */

import OpenAI from 'openai';

/**
 * Generate executive summary using OpenAI (if API key available)
 */
export async function generateAISummary(news, apiKey) {
  if (!apiKey) {
    return generateExtractiveSummary(news);
  }
  
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare news digest for the AI
    const newsDigest = news.slice(0, 15).map((item, i) => 
      `${i + 1}. [${item.category.toUpperCase()}] ${item.title} (${item.source})`
    ).join('\n');
    
    const prompt = `You are a news analyst. Based on today's selection of news articles about AI and Fraud/Cybersecurity, write a brief executive summary.

TODAY'S NEWS:
${newsDigest}

Write an executive summary with:
1. A 2-3 sentence overview of the main themes
2. 4-6 bullet points highlighting key insights
3. Keep it factual - only reference what's in the articles above
4. Use professional but accessible language
5. Start with "Today's selection covers..."

Format as plain text with bullet points using "•" character.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });
    
    return {
      type: 'ai',
      content: response.choices[0].message.content,
      generated: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI API error, falling back to extractive summary:', error.message);
    return generateExtractiveSummary(news);
  }
}

/**
 * Generate extractive summary without AI
 * Creates a structured summary from the news items themselves
 */
export function generateExtractiveSummary(news) {
  const aiNews = news.filter(n => n.category === 'ai' || n.category === 'both');
  const fraudNews = news.filter(n => n.category === 'fraud' || n.category === 'both');
  
  // Count sources
  const sources = new Set(news.map(n => n.source));
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Build summary
  let content = `Today's selection covers ${news.length} articles from ${sources.size} trusted sources, `;
  content += `including ${aiNews.length} on Artificial Intelligence and ${fraudNews.length} on Fraud/Cybersecurity.\n\n`;
  
  // Key insights
  const insights = [];
  
  // AI insights
  if (aiNews.length > 0) {
    const topAI = aiNews.slice(0, 3);
    insights.push(`• **AI Spotlight**: ${topAI[0]?.title || 'Latest developments in artificial intelligence'}`);
    
    // Look for company mentions
    const companies = [];
    const text = aiNews.map(n => n.title + ' ' + n.description).join(' ').toLowerCase();
    if (text.includes('openai')) companies.push('OpenAI');
    if (text.includes('google') || text.includes('gemini')) companies.push('Google');
    if (text.includes('anthropic') || text.includes('claude')) companies.push('Anthropic');
    if (text.includes('microsoft')) companies.push('Microsoft');
    if (text.includes('meta')) companies.push('Meta');
    
    if (companies.length > 0) {
      insights.push(`• **Companies in Focus**: Coverage includes developments from ${companies.slice(0, 3).join(', ')}`);
    }
  }
  
  // Fraud insights
  if (fraudNews.length > 0) {
    const topFraud = fraudNews.slice(0, 3);
    insights.push(`• **Security Alert**: ${topFraud[0]?.title || 'Latest in cybersecurity and fraud prevention'}`);
    
    // Look for threat types
    const threats = [];
    const text = fraudNews.map(n => n.title + ' ' + n.description).join(' ').toLowerCase();
    if (text.includes('ransomware')) threats.push('ransomware');
    if (text.includes('phishing')) threats.push('phishing');
    if (text.includes('breach') || text.includes('data breach')) threats.push('data breaches');
    if (text.includes('scam')) threats.push('scams');
    if (text.includes('malware')) threats.push('malware');
    
    if (threats.length > 0) {
      insights.push(`• **Threat Landscape**: Today's coverage highlights ${threats.slice(0, 3).join(', ')}`);
    }
  }
  
  // Source diversity
  const topSources = [...sources].slice(0, 5);
  insights.push(`• **Source Diversity**: Articles sourced from ${topSources.join(', ')}${sources.size > 5 ? ' and others' : ''}`);
  
  // Recency
  const todayCount = news.filter(n => {
    const diff = (new Date() - new Date(n.pubDate)) / (1000 * 60 * 60);
    return diff < 24;
  }).length;
  
  if (todayCount > 0) {
    insights.push(`• **Fresh Content**: ${todayCount} articles published in the last 24 hours`);
  }
  
  content += insights.join('\n');
  
  return {
    type: 'extractive',
    content,
    generated: new Date().toISOString(),
    stats: {
      totalArticles: news.length,
      aiArticles: aiNews.length,
      fraudArticles: fraudNews.length,
      sources: sources.size,
      todayCount
    }
  };
}

/**
 * Generate summary (main entry point)
 */
export async function generateSummary(news, openaiApiKey = null) {
  if (news.length === 0) {
    return {
      type: 'empty',
      content: "No news articles available for today's summary. Check back later for updates.",
      generated: new Date().toISOString()
    };
  }
  
  // Try AI summary if key provided, otherwise use extractive
  if (openaiApiKey) {
    return await generateAISummary(news, openaiApiKey);
  }
  
  return generateExtractiveSummary(news);
}
