/**
 * News Radar - Frontend Application
 */

// Configuration
const CONFIG = {
  dataUrl: 'data/news.json',
  // Cloudflare Worker URL for UPDATE button (set this after deploying worker)
  workerUrl: null, // e.g., 'https://news-radar-update.your-subdomain.workers.dev'
  refreshInterval: 5 * 60 * 1000, // 5 minutes
};

// State
let newsData = null;
let currentFilter = 'all';

// DOM Elements
const elements = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  topStories: document.getElementById('top-stories'),
  topStoriesGrid: document.getElementById('top-stories-grid'),
  moreNews: document.getElementById('more-news'),
  moreNewsList: document.getElementById('more-news-list'),
  summarySection: document.getElementById('summary-section'),
  summaryContent: document.getElementById('summary-content'),
  summaryType: document.getElementById('summary-type'),
  summaryGenerated: document.getElementById('summary-generated'),
  lastUpdated: document.getElementById('last-updated'),
  articleCount: document.getElementById('article-count'),
  sourceCount: document.getElementById('source-count'),
  updateBtn: document.getElementById('update-btn'),
  updateStatus: document.getElementById('update-status'),
  themeToggle: document.getElementById('theme-toggle'),
  filterTabs: document.querySelectorAll('.tab'),
  countAll: document.getElementById('count-all'),
  countAi: document.getElementById('count-ai'),
  countFraud: document.getElementById('count-fraud'),
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  initTheme();
  initEventListeners();
  await loadNews();
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Event Listeners
function initEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Filter tabs
  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      setActiveFilter(filter);
    });
  });
  
  // Update button
  elements.updateBtn.addEventListener('click', handleUpdate);
  
  // Keyboard navigation for tabs
  elements.filterTabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        const next = elements.filterTabs[(index + 1) % elements.filterTabs.length];
        next.focus();
        next.click();
      } else if (e.key === 'ArrowLeft') {
        const prev = elements.filterTabs[(index - 1 + elements.filterTabs.length) % elements.filterTabs.length];
        prev.focus();
        prev.click();
      }
    });
  });
}

// Load News Data
async function loadNews() {
  showLoading();
  
  try {
    const response = await fetch(CONFIG.dataUrl + '?t=' + Date.now());
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    newsData = await response.json();
    renderNews();
    hideLoading();
    
  } catch (error) {
    console.error('Failed to load news:', error);
    showError(`Failed to load news: ${error.message}`);
  }
}

// Render Functions
function renderNews() {
  if (!newsData) return;
  
  // Update metadata
  updateMetadata();
  
  // Update filter counts
  updateFilterCounts();
  
  // Get filtered news
  const filteredTop = filterNews(newsData.top);
  const filteredMore = filterNews(newsData.more);
  
  // Render sections
  renderTopStories(filteredTop);
  renderMoreNews(filteredMore);
  renderSummary(newsData.summary);
  
  // Show sections
  elements.topStories.hidden = filteredTop.length === 0;
  elements.moreNews.hidden = filteredMore.length === 0;
  elements.summarySection.hidden = !newsData.summary;
}

function renderTopStories(news) {
  elements.topStoriesGrid.innerHTML = news.map(item => `
    <article class="news-card">
      <div class="news-card-content">
        <div class="news-card-meta">
          <span class="news-source">${escapeHtml(item.source)}</span>
          <span class="news-date">${formatDate(item.pubDate)}</span>
          <span class="news-category ${item.category}">${formatCategory(item.category)}</span>
        </div>
        <h3 class="news-card-title">
          <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.title)}
          </a>
        </h3>
        ${item.description ? `<p class="news-card-description">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </article>
  `).join('');
}

function renderMoreNews(news) {
  elements.moreNewsList.innerHTML = news.map(item => `
    <article class="news-item">
      <div class="news-item-content">
        <h3 class="news-item-title">
          <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.title)}
          </a>
        </h3>
        <div class="news-item-meta">
          <span class="news-source">${escapeHtml(item.source)}</span>
          <span>•</span>
          <span class="news-date">${formatDate(item.pubDate)}</span>
          <span>•</span>
          <span class="news-category ${item.category}">${formatCategory(item.category)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function renderSummary(summary) {
  if (!summary) return;
  
  // Convert markdown-style formatting to HTML
  let content = escapeHtml(summary.content)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/•/g, '<br>•');
  
  elements.summaryContent.innerHTML = content;
  elements.summaryType.textContent = summary.type === 'ai' ? '🤖 AI-Generated' : '📊 Auto-Generated';
  elements.summaryGenerated.textContent = `Generated: ${formatDateTime(summary.generated)}`;
}

// Update Metadata
function updateMetadata() {
  const meta = newsData.metadata;
  
  elements.lastUpdated.textContent = `Updated: ${formatDateTime(meta.generated)}`;
  elements.articleCount.textContent = `${meta.totalArticles} articles`;
  elements.sourceCount.textContent = `${meta.sources} sources`;
}

// Filter Management
function setActiveFilter(filter) {
  currentFilter = filter;
  
  // Update tab states
  elements.filterTabs.forEach(tab => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
  
  // Re-render news
  renderNews();
}

function filterNews(news) {
  if (currentFilter === 'all') return news;
  
  return news.filter(item => {
    if (currentFilter === 'ai') {
      return item.category === 'ai' || item.category === 'both';
    }
    if (currentFilter === 'fraud') {
      return item.category === 'fraud' || item.category === 'both';
    }
    return true;
  });
}

function updateFilterCounts() {
  if (!newsData) return;
  
  const all = newsData.all;
  const aiCount = all.filter(n => n.category === 'ai' || n.category === 'both').length;
  const fraudCount = all.filter(n => n.category === 'fraud' || n.category === 'both').length;
  
  elements.countAll.textContent = all.length;
  elements.countAi.textContent = aiCount;
  elements.countFraud.textContent = fraudCount;
}

// Update Handler
async function handleUpdate() {
  const btnText = elements.updateBtn.querySelector('.btn-text');
  const btnLoading = elements.updateBtn.querySelector('.btn-loading');
  
  // Show loading state
  btnText.hidden = true;
  btnLoading.hidden = false;
  elements.updateBtn.disabled = true;
  
  try {
    if (CONFIG.workerUrl) {
      // Call Cloudflare Worker to trigger update
      await triggerUpdate();
      showUpdateStatus('Update triggered! Refreshing in 30s...', 'success');
      
      // Wait for GitHub Actions to complete and refresh
      setTimeout(async () => {
        await loadNews();
        showUpdateStatus('Updated!', 'success');
      }, 30000);
      
    } else {
      // No worker configured - show manual instructions
      showUpdateInstructions();
    }
    
  } catch (error) {
    console.error('Update failed:', error);
    showUpdateStatus(`Update failed: ${error.message}`, 'error');
    
  } finally {
    btnText.hidden = false;
    btnLoading.hidden = true;
    elements.updateBtn.disabled = false;
  }
}

async function triggerUpdate() {
  const response = await fetch(CONFIG.workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

function showUpdateInstructions() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">🔄 Manual Update</h2>
      <p>Automatic updates run every 4 hours. To update manually:</p>
      <ol>
        <li>Go to the GitHub repository</li>
        <li>Click <strong>Actions</strong> tab</li>
        <li>Select <strong>Update News</strong> workflow</li>
        <li>Click <strong>Run workflow</strong></li>
      </ol>
      <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted);">
        To enable the UPDATE button, deploy the Cloudflare Worker (see README).
      </p>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
        Got it
      </button>
    </div>
  `;
  
  // Add modal styles if not present
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-md);
      }
      .modal {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        max-width: 480px;
        width: 100%;
        box-shadow: var(--shadow-lg);
      }
      .modal h2 {
        margin-bottom: var(--spacing-md);
      }
      .modal ol {
        margin: var(--spacing-md) 0;
        padding-left: var(--spacing-lg);
      }
      .modal li {
        margin: var(--spacing-sm) 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function showUpdateStatus(message, type) {
  elements.updateStatus.textContent = message;
  elements.updateStatus.className = `update-status ${type}`;
  elements.updateStatus.hidden = false;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.updateStatus.hidden = true;
  }, 5000);
}

// UI State Helpers
function showLoading() {
  elements.loading.hidden = false;
  elements.error.hidden = true;
  elements.topStories.hidden = true;
  elements.moreNews.hidden = true;
  elements.summarySection.hidden = true;
}

function hideLoading() {
  elements.loading.hidden = true;
}

function showError(message) {
  elements.loading.hidden = true;
  elements.error.hidden = false;
  elements.errorMessage.textContent = message;
}

// Utility Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatCategory(category) {
  const labels = {
    ai: 'AI',
    fraud: 'Fraud',
    both: 'AI + Fraud',
    general: 'General'
  };
  return labels[category] || category;
}

// Auto-refresh (optional)
// setInterval(loadNews, CONFIG.refreshInterval);
