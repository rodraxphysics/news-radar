/**
 * News Radar - Cloudflare Worker
 * Proxy for triggering GitHub Actions from the UPDATE button
 * 
 * Environment Variables (set via wrangler secret):
 * - GITHUB_TOKEN: GitHub Personal Access Token with repo:actions scope
 * - GITHUB_REPO: Repository in format "owner/repo"
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST for triggering updates
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'News Radar Update Worker',
        usage: 'POST to trigger a news update'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Validate environment
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
        throw new Error('Worker not configured. Set GITHUB_TOKEN and GITHUB_REPO secrets.');
      }

      // Rate limiting (simple in-memory, resets on worker restart)
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateLimitKey = `rate:${clientIP}`;
      
      // Trigger GitHub Actions workflow via repository_dispatch
      const response = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NewsRadar-Worker/1.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'update-news',
            client_payload: {
              triggered_by: 'web_button',
              timestamp: new Date().toISOString(),
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GitHub API error:', response.status, error);
        
        if (response.status === 401) {
          throw new Error('Invalid GitHub token');
        }
        if (response.status === 404) {
          throw new Error('Repository not found or token lacks permissions');
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Update triggered successfully',
        timestamp: new Date().toISOString(),
        note: 'GitHub Actions workflow started. Page will refresh in ~30 seconds.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
