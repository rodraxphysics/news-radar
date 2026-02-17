# 📡 News Radar

A clean, responsive news aggregator focused on **Artificial Intelligence** and **Fraud/Cybersecurity** news from trusted sources.

![News Radar](https://img.shields.io/badge/News-Radar-blue?style=for-the-badge)
![Cloudflare Pages](https://img.shields.io/badge/Hosted-Cloudflare%20Pages-orange?style=for-the-badge)

## ✨ Features

- 🔍 **Curated Sources**: Only trusted publications (Reuters, BBC, WSJ, MIT Tech Review, etc.)
- 📅 **3-Day Window**: Shows news from the last 3 days, prioritizing today
- 🏷️ **Topic Filters**: View All, AI-only, or Fraud-only news
- 📊 **Smart Ranking**: Combines recency, source authority, and keyword relevance
- 📝 **Executive Summary**: Auto-generated daily insights
- 🔄 **Live Updates**: UPDATE button triggers fresh data fetch
- 🌓 **Dark/Light Mode**: Respects system preference + manual toggle
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEWS RADAR ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────────────┐ │
│  │   USER       │────▶│  CLOUDFLARE      │────▶│  STATIC FILES           │ │
│  │   BROWSER    │     │  PAGES           │     │  (docs/)                │ │
│  └──────────────┘     └──────────────────┘     │  • index.html           │ │
│         │                                       │  • styles.css           │ │
│         │                                       │  • app.js               │ │
│         │                                       │  • data/news.json       │ │
│         │                                       └─────────────────────────┘ │
│         │                                                    ▲              │
│         │ UPDATE                                             │              │
│         │ button                                             │ git push     │
│         ▼                                                    │              │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────┴────────────┐ │
│  │  CLOUDFLARE  │────▶│   GITHUB         │────▶│  GITHUB ACTIONS         │ │
│  │  WORKER      │     │   API            │     │  (update-news.yml)      │ │
│  │  (proxy)     │     │ repository_      │     │                         │ │
│  └──────────────┘     │ dispatch         │     │  1. Fetch RSS feeds     │ │
│                       └──────────────────┘     │  2. Filter whitelist    │ │
│                                                │  3. Rank articles       │ │
│                                                │  4. Generate summary    │ │
│                                                │  5. Commit news.json    │ │
│                                                │  6. Auto-deploy         │ │
│                                                └─────────────────────────┘ │
│                                                            │                │
│                           NEWS SOURCES                     │                │
│    ┌───────────────────────────────────────────────────────┘                │
│    │                                                                        │
│    ▼                                                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Google    │  │  Direct    │  │  NewsAPI   │  │  Security  │            │
│  │  News RSS  │  │  RSS Feeds │  │  (optional)│  │  RSS Feeds │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
│      ▲               ▲               ▲               ▲                      │
│      │               │               │               │                      │
│   AI queries      Wired         AI/Fraud          Krebs                    │
│   Fraud queries   TechCrunch    articles          DarkReading              │
│                   The Verge                       BleepingComputer         │
│                   Ars Technica                    SecurityWeek             │
│                   BBC Tech                                                 │
│                   NYT Tech                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
news-radar/
├── .github/workflows/
│   └── update-news.yml     # GitHub Actions: fetch + commit every 4h
├── docs/                   # Static site (Cloudflare Pages)
│   ├── index.html          # Main HTML
│   ├── styles.css          # CSS (dark/light mode)
│   ├── app.js              # Frontend JavaScript
│   └── data/
│       └── news.json       # Generated news data
├── scripts/                # Node.js data fetcher
│   ├── fetch-news.js       # Main fetcher script
│   ├── sources.js          # Domains whitelist, RSS feeds, keywords
│   ├── ranking.js          # Scoring algorithm
│   ├── summary.js          # Executive summary generator
│   └── package.json
├── worker/                 # Cloudflare Worker (UPDATE button proxy)
│   ├── index.js
│   └── wrangler.toml
└── README.md
```

---

## 🚀 Deploy Guide

### Prerequisites

1. **GitHub Account** - for repository and Actions
2. **Cloudflare Account** - for Pages hosting (free tier works)

---

### Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up for free
3. Verify your email

---

### Step 2: Create GitHub Repository

1. Create a new repository on GitHub (e.g., `news-radar`)
2. Push this code:

```bash
cd news-radar
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/news-radar.git
git push -u origin main
```

---

### Step 3: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Authorize GitHub and select your `news-radar` repository
4. Configure build settings:
   - **Project name**: `news-radar` (or your preferred subdomain)
   - **Production branch**: `main`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `docs`
5. Click **Save and Deploy**

Your site will be live at: `https://news-radar.pages.dev` (or your custom subdomain)

---

### Step 4: Configure GitHub Actions

The workflow runs automatically every 4 hours. For manual updates:

1. Go to your GitHub repo → **Actions** tab
2. Select **Update News** workflow
3. Click **Run workflow**

**Optional API Keys** (add as GitHub Secrets → Settings → Secrets → Actions):

| Secret | Purpose |
|--------|---------|
| `NEWSAPI_KEY` | NewsAPI.org for more sources (free: 1000 req/day) |
| `OPENAI_API_KEY` | AI-powered executive summaries |

> Without API keys, the app works fine using RSS feeds (unlimited, free).

---

### Step 5: Enable UPDATE Button (Optional)

The UPDATE button needs a proxy to securely trigger GitHub Actions.

#### 5.1 Create GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure:
   - **Token name**: `news-radar-update`
   - **Repository access**: Only select `news-radar`
   - **Permissions**: 
     - **Actions**: Read and write
4. Copy the token (you won't see it again!)

#### 5.2 Deploy Cloudflare Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to worker directory
cd worker

# Set secrets
wrangler secret put GITHUB_TOKEN
# Paste your GitHub PAT when prompted

wrangler secret put GITHUB_REPO
# Enter: YOUR_USERNAME/news-radar

# Deploy
wrangler deploy
```

Note the worker URL (e.g., `https://news-radar-update.YOUR_SUBDOMAIN.workers.dev`)

#### 5.3 Update Frontend

Edit `docs/app.js` line 6:

```javascript
workerUrl: 'https://news-radar-update.YOUR_SUBDOMAIN.workers.dev',
```

Commit and push. Cloudflare Pages auto-deploys.

---

## 🔄 UPDATE Button Flow

```
User clicks UPDATE
       │
       ▼
┌──────────────────┐
│ Frontend (app.js)│
│ shows "Updating…"│
└────────┬─────────┘
         │ POST
         ▼
┌──────────────────┐
│ Cloudflare Worker│
│ (proxy)          │
└────────┬─────────┘
         │ repository_dispatch
         ▼
┌──────────────────┐
│ GitHub Actions   │
│ update-news.yml  │
└────────┬─────────┘
         │ fetch → rank → commit
         ▼
┌──────────────────┐
│ Cloudflare Pages │
│ auto-deploys     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Frontend refreshes│
│ shows "Updated at…"│
└──────────────────┘
```

---

## 📊 Ranking Algorithm

```
finalScore = (recencyScore × 0.4) + (authorityScore × 0.3) + (keywordScore × 0.3)

Recency (based on publication date):
  • Today:       100 points
  • Yesterday:    70 points
  • 2 days ago:   40 points
  • 3 days ago:   20 points

Authority (source tier):
  • Tier 1 (Reuters, AP, FT, Economist, WSJ, Bloomberg): 98-100
  • Tier 2 (BBC, NYT, Guardian, WaPo): 90-95
  • Tier 3 (Wired, Verge, TechCrunch, Ars): 80-85
  • Security (Krebs, DarkReading, BleepingComputer): 80-92
  • Default whitelisted: 60

Keywords:
  • Primary keyword in title: +50
  • Secondary keyword in title: +30
  • Keyword in description: +20
```

---

## 🛡️ Trusted Sources Whitelist

| Category | Sources |
|----------|---------|
| **Wire Services** | Reuters, AP |
| **Premium** | FT, Economist, WSJ, Bloomberg |
| **Major News** | BBC, NYT, WaPo, Guardian, CNN, CNBC |
| **Tech Media** | Wired, The Verge, TechCrunch, Ars Technica, MIT Tech Review |
| **Security** | Krebs on Security, Dark Reading, BleepingComputer, SecurityWeek, Cyberscoop |
| **Finance** | Finextra, American Banker, PYMNTS |

Only articles from these domains are included.

---

## 🧪 Local Development

```bash
# Install dependencies
cd scripts
npm install

# Run fetcher locally
node fetch-news.js

# Dry run (don't write files)
node fetch-news.js --dry-run

# Serve frontend
cd ../docs
npx serve .
```

---

## 📄 License

MIT License - feel free to fork and customize!

---

Built with ❤️ using GitHub Actions + Cloudflare Pages
