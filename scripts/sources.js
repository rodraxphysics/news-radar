/**
 * News Sources Configuration
 * - Whitelist of trusted domains
 * - RSS feed URLs
 * - Source authority scores
 * - Keywords for categorization
 */

// Trusted domains whitelist - only news from these domains will be included
export const TRUSTED_DOMAINS = [
  // Tier 1 - Wire Services & Premium
  'reuters.com',
  'apnews.com',
  'ft.com',
  'economist.com',
  'wsj.com',
  'bloomberg.com',
  
  // Tier 2 - Major News Organizations
  'bbc.com',
  'bbc.co.uk',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'cnn.com',
  'cnbc.com',
  
  // Tier 3 - Tech & Specialized
  'wired.com',
  'theverge.com',
  'techcrunch.com',
  'technologyreview.com',
  'arstechnica.com',
  'zdnet.com',
  'venturebeat.com',
  'theregister.com',
  
  // Security & Fraud Specific
  'krebsonsecurity.com',
  'darkreading.com',
  'bleepingcomputer.com',
  'securityweek.com',
  'cyberscoop.com',
  'bankinfosecurity.com',
  
  // Financial
  'finextra.com',
  'americanbanker.com',
  'pymnts.com'
];

// Source authority scores (0-100)
export const SOURCE_AUTHORITY = {
  // Tier 1 - 100 points
  'reuters.com': 100,
  'apnews.com': 100,
  'ft.com': 100,
  'economist.com': 100,
  'wsj.com': 98,
  'bloomberg.com': 98,
  
  // Tier 2 - 85-95 points
  'bbc.com': 95,
  'bbc.co.uk': 95,
  'nytimes.com': 95,
  'washingtonpost.com': 92,
  'theguardian.com': 90,
  'cnn.com': 85,
  'cnbc.com': 88,
  
  // Tier 3 - 75-85 points
  'wired.com': 85,
  'theverge.com': 82,
  'techcrunch.com': 80,
  'technologyreview.com': 90,
  'arstechnica.com': 85,
  'zdnet.com': 75,
  'venturebeat.com': 78,
  'theregister.com': 78,
  
  // Security Specialized - 80-90 points
  'krebsonsecurity.com': 92,
  'darkreading.com': 85,
  'bleepingcomputer.com': 82,
  'securityweek.com': 80,
  'cyberscoop.com': 82,
  'bankinfosecurity.com': 80,
  
  // Financial - 75-85 points
  'finextra.com': 80,
  'americanbanker.com': 82,
  'pymnts.com': 75
};

// Default authority for whitelisted but unscored domains
export const DEFAULT_AUTHORITY = 60;

// Keywords for topic classification
export const KEYWORDS = {
  ai: {
    primary: [
      'artificial intelligence', 'AI', 'machine learning', 'deep learning',
      'neural network', 'GPT', 'LLM', 'large language model', 'ChatGPT',
      'OpenAI', 'Anthropic', 'Claude', 'Gemini', 'generative AI',
      'transformer', 'diffusion model', 'computer vision', 'NLP',
      'natural language processing', 'AI regulation', 'AI safety',
      'AGI', 'artificial general intelligence'
    ],
    secondary: [
      'automation', 'algorithm', 'data science', 'predictive',
      'model training', 'inference', 'GPU', 'NVIDIA', 'tensor',
      'reinforcement learning', 'supervised learning', 'unsupervised',
      'foundation model', 'multimodal', 'AI chip', 'AI startup'
    ]
  },
  fraud: {
    primary: [
      'fraud', 'scam', 'cyberfraud', 'phishing', 'identity theft',
      'financial crime', 'money laundering', 'ransomware', 'cybercrime',
      'data breach', 'hacking', 'malware', 'social engineering',
      'wire fraud', 'bank fraud', 'credit card fraud', 'account takeover',
      'synthetic identity', 'deepfake fraud', 'BEC', 'business email compromise'
    ],
    secondary: [
      'cybersecurity', 'security breach', 'vulnerability', 'exploit',
      'threat actor', 'criminal', 'investigation', 'prosecution',
      'compliance', 'AML', 'anti-money laundering', 'KYC',
      'fraud detection', 'fraud prevention', 'suspicious activity',
      'financial loss', 'victim', 'scheme', 'ponzi', 'cryptocurrency scam'
    ]
  }
};

// Google News RSS search queries
export const GOOGLE_NEWS_QUERIES = {
  ai: [
    'artificial intelligence',
    'ChatGPT OR OpenAI OR Anthropic',
    'machine learning AI',
    'generative AI',
    'AI regulation safety'
  ],
  fraud: [
    'cyber fraud scam',
    'financial fraud crime',
    'phishing attack',
    'ransomware cybercrime',
    'data breach hack',
    'identity theft'
  ]
};

// Direct RSS feeds from trusted sources
export const RSS_FEEDS = {
  ai: [
    {
      url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
      source: 'Ars Technica',
      domain: 'arstechnica.com'
    },
    {
      url: 'https://www.wired.com/feed/category/artificial-intelligence/latest/rss',
      source: 'Wired',
      domain: 'wired.com'
    },
    {
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      source: 'TechCrunch',
      domain: 'techcrunch.com'
    },
    {
      url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
      source: 'The Verge',
      domain: 'theverge.com'
    }
  ],
  fraud: [
    {
      url: 'https://krebsonsecurity.com/feed/',
      source: 'Krebs on Security',
      domain: 'krebsonsecurity.com'
    },
    {
      url: 'https://www.darkreading.com/rss.xml',
      source: 'Dark Reading',
      domain: 'darkreading.com'
    },
    {
      url: 'https://www.bleepingcomputer.com/feed/',
      source: 'BleepingComputer',
      domain: 'bleepingcomputer.com'
    },
    {
      url: 'https://feeds.feedburner.com/securityweek',
      source: 'SecurityWeek',
      domain: 'securityweek.com'
    }
  ],
  general: [
    {
      url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
      source: 'BBC Technology',
      domain: 'bbc.com'
    },
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
      source: 'NY Times Tech',
      domain: 'nytimes.com'
    }
  ]
};

// NewsAPI configuration (optional - needs API key)
export const NEWSAPI_CONFIG = {
  baseUrl: 'https://newsapi.org/v2',
  queries: {
    ai: '(artificial intelligence OR machine learning OR ChatGPT OR OpenAI OR generative AI) AND NOT (stock OR shares)',
    fraud: '(cyber fraud OR financial fraud OR phishing OR ransomware OR data breach OR scam) AND NOT (sports)'
  },
  // Domains to request from NewsAPI
  domains: 'reuters.com,bbc.co.uk,theguardian.com,wired.com,techcrunch.com,arstechnica.com,theverge.com,bleepingcomputer.com'
};

// Time window configuration
export const TIME_CONFIG = {
  windowDays: 3,  // Show news from last 3 days
  timezone: 'UTC'
};
