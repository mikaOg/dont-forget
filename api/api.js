const pool = require('../lib/db');
const Groq = require('groq-sdk');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper functions
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// === YOUTUBE STATS ===
async function getYouTubeStats(username) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key missing');

  const searchRes = await axios.get(
    'https://www.googleapis.com/youtube/v3/search',
    {
      params: {
        part: 'snippet',
        q: username.replace('@', ''),
        type: 'channel',
        maxResults: 1,
        key: apiKey
      }
    }
  );

  if (!searchRes.data.items || searchRes.data.items.length === 0) {
    throw new Error('Channel not found');
  }

  const channelId = searchRes.data.items[0].snippet.channelId;

  const channelRes = await axios.get(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      params: {
        part: 'snippet,statistics',
        id: channelId,
        key: apiKey
      }
    }
  );

  const channel = channelRes.data.items[0];
  const stats = channel.statistics;

  return {
    id: channel.id,
    name: channel.snippet.title,
    username: channel.snippet.customUrl || channel.snippet.title,
    followerCount: parseInt(stats.subscriberCount || 0),
    videoCount: parseInt(stats.videoCount || 0),
    viewCount: parseInt(stats.viewCount || 0),
    description: channel.snippet.description || '',
    thumbnail: channel.snippet.thumbnails.default.url,
    platform: 'youtube',
    isVerified: channel.snippet.verified || false
  };
}

// === TRENDS ===
async function getTrends() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let youtube = [], news = [], twitter = [];

  // YouTube
  if (apiKey) {
    try {
      const res = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'snippet,statistics',
            chart: 'mostPopular',
            regionCode: 'ET',
            maxResults: 10,
            key: apiKey
          },
          timeout: 8000
        }
      );
      youtube = res.data.items.map(item => ({
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        views: parseInt(item.statistics.viewCount || 0),
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${item.id}`
      }));
    } catch {}
  }

  // News
  try {
    const res = await axios.get(
      'https://news.google.com/rss/search?q=ethiopia&hl=en-US&gl=US&ceid=US:en',
      { timeout: 8000 }
    );
    const parsed = await parseStringPromise(res.data);
    const items = parsed.rss?.channel?.[0]?.item || [];
    news = items.slice(0, 10).map(item => ({
      title: item.title?.[0]?.replace(/\(.*?\)/g, '').trim() || 'Ethiopia News',
      link: item.link?.[0] || '#',
      source: item.source?.[0]?.$?.url || 'Google News'
    }));
  } catch {}

  // Twitter
  try {
    const res = await axios.get(
      'https://api.allorigins.win/raw?url=' + 
      encodeURIComponent('https://twitter.com/i/trends/place/23424808'),
      { timeout: 8000 }
    );
    const matches = res.data.match(/"name":"([^"]+)","promotedContent/g);
    if (matches) {
      twitter = matches.slice(0, 10).map(m => m.replace(/name":"|","promotedContent/g, ''));
    }
  } catch {}

  return {
    youtube: youtube.length > 0 ? youtube : ['YouTube trending unavailable'],
    news: news.length > 0 ? news : ['Google News: Ethiopia updates'],
    twitter: twitter.length > 0 ? twitter : ['Addis Ababa', 'Ethiopian Music', 'Ethiopian Food'],
    timestamp: new Date().toISOString()
  };
}

// === AI CAPTIONS ===
async function generateCaptions(topic, platform = 'tiktok') {
  const prompt = `Generate 5 engaging captions for ${platform} about "${topic}". Each under 80 chars, include hashtags, use emojis. Return ONLY JSON array.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a creative social media caption writer.' },
      { role: 'user', content: prompt }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.9,
    max_tokens: 500
  });

  return JSON.parse(completion.choices[0].message.content);
}

// === MAIN HANDLER ===
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url.split('?')[0];
    const params = req.query || {};

    // GET /api/youtube-stats
    if (url === '/api/youtube-stats' && req.method === 'GET') {
      const { username } = params;
      if (!username) return res.status(400).json({ error: 'Username required' });
      const data = await getYouTubeStats(username);
      return res.json({ success: true, data });
    }

    // GET /api/trends
    if (url === '/api/trends' && req.method === 'GET') {
      const data = await getTrends();
      return res.json({ success: true, data });
    }

    // POST /api/ai-tools
    if (url === '/api/ai-tools' && req.method === 'POST') {
      const { tool, topic } = req.body;
      if (tool === 'caption' && topic) {
        const captions = await generateCaptions(topic);
        return res.json({ success: true, captions });
      }
      return res.status(400).json({ error: 'Invalid tool or missing topic' });
    }

    // GET /api/analyze - User status
    if (url === '/api/analyze' && req.method === 'GET') {
      const { fingerprint } = params;
      if (!fingerprint) return res.status(400).json({ error: 'Fingerprint required' });

      let userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
      let user = userRes.rows[0];
      if (!user) {
        await pool.query('INSERT INTO users (fingerprint) VALUES ($1)', [fingerprint]);
        userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
        user = userRes.rows[0];
      }
      return res.json({
        success: true,
        user: {
          is_premium: user.is_premium,
          analyses_used: user.analyses_used || 0,
          analyses_limit: user.analyses_limit || 1,
          premium_expiry: user.premium_expiry
        }
      });
    }

    // POST /api/analyze - Content analysis
    if (url === '/api/analyze' && req.method === 'POST') {
      const { text, fingerprint } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

      let userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
      let user = userRes.rows[0];
      if (!user) {
        await pool.query('INSERT INTO users (fingerprint) VALUES ($1)', [fingerprint]);
        userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
        user = userRes.rows[0];
      }

      if (!user.is_premium && user.analyses_used >= user.analyses_limit) {
        return res.status(403).json({ error: 'Free limit reached. Upgrade to Premium.' });
      }

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an Ethiopian social media expert. Analyze content for virality. Return JSON: {"score":0-100,"sentiment":"positive|neutral|negative","quality":"excellent|good|average|poor","topics":[],"tips":[],"hashtags":[]}`
          },
          { role: 'user', content: `Analyze: "${text}"` }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 500
      });

      const result = JSON.parse(completion.choices[0].message.content);
      await pool.query('UPDATE users SET analyses_used = analyses_used + 1 WHERE fingerprint = $1', [fingerprint]);

      return res.json({
        success: true,
        analysis: result,
        remaining: user.is_premium ? 'unlimited' : Math.max(0, user.analyses_limit - user.analyses_used - 1)
      });
    }

    // 404
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
