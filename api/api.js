const pool = require('../lib/db');
const Groq = require('groq-sdk');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: format numbers
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
      },
      timeout: 10000
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
      },
      timeout: 10000
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
    isVerified: channel.snippet.verified || false,
    isPrivate: false
  };
}

// === TRENDS ===
async function getTrends() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let youtube = [], news = [], twitter = [];

  // YouTube trending
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
          timeout: 10000
        }
      );
      youtube = res.data.items.map(item => ({
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        views: parseInt(item.statistics.viewCount || 0),
        likes: parseInt(item.statistics.likeCount || 0),
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        platform: 'youtube'
      }));
    } catch (err) {
      console.error('YouTube trending error:', err.message);
    }
  }

  // Google News
  try {
    const res = await axios.get(
      'https://news.google.com/rss/search?q=ethiopia&hl=en-US&gl=US&ceid=US:en',
      { timeout: 10000 }
    );
    const parsed = await parseStringPromise(res.data);
    const items = parsed.rss?.channel?.[0]?.item || [];
    news = items.slice(0, 10).map(item => ({
      title: item.title?.[0]?.replace(/\(.*?\)/g, '').trim() || 'Ethiopia News',
      link: item.link?.[0] || '#',
      source: item.source?.[0]?.$?.url || 'Google News',
      platform: 'news'
    }));
  } catch (err) {
    console.error('News error:', err.message);
  }

  // Twitter trends
  try {
    const res = await axios.get(
      'https://api.allorigins.win/raw?url=' + 
      encodeURIComponent('https://twitter.com/i/trends/place/23424808'),
      { timeout: 10000 }
    );
    const matches = res.data.match(/"name":"([^"]+)","promotedContent/g);
    if (matches) {
      twitter = matches.slice(0, 10).map((m, i) => ({
        id: `tw_${i}`,
        title: m.replace(/name":"|","promotedContent/g, ''),
        platform: 'twitter'
      }));
    }
  } catch (err) {
    console.error('Twitter error:', err.message);
  }

  return {
    youtube: youtube,
    news: news,
    twitter: twitter.length > 0 ? twitter : [
      { id: 'fb1', title: 'Addis Ababa', platform: 'twitter' },
      { id: 'fb2', title: 'Ethiopian Music', platform: 'twitter' },
      { id: 'fb3', title: 'Ethiopian Food', platform: 'twitter' }
    ],
    timestamp: new Date().toISOString()
  };
}

// === AI CAPTIONS ===
async function generateCaptions(topic, platform = 'tiktok') {
  const prompt = `Generate 5 engaging captions for ${platform} about "${topic}". Each under 80 chars, include hashtags, use emojis, mix Amharic/English. Return ONLY JSON array of objects with: text, hashtags, vibe.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a creative Ethiopian social media caption writer.' },
      { role: 'user', content: prompt }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.9,
    max_tokens: 500
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return Array.isArray(result) ? result.slice(0, 5) : result.captions?.slice(0, 5) || [];
}

// === AI ANALYSIS ===
async function analyzeContent(text) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an Ethiopian social media expert. Analyze content for virality. Return ONLY JSON: {"score":0-100,"sentiment":"positive|neutral|negative","quality":"excellent|good|average|poor","topics":[],"tips":[],"hashtags":[],"flagged":[]}`
      },
      { role: 'user', content: `Analyze this content: "${text}"` }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    max_tokens: 500
  });

  return JSON.parse(completion.choices[0].message.content);
}

// === CBE UPLOAD ===
const { put } = require('@vercel/blob');

async function cbeUpload(fingerprint, transferRef, imageBase64) {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > 4 * 1024 * 1024) throw new Error('Image too large. Max 4MB.');

  const blob = await put(`cbe-screenshots/${transferRef}.jpg`, buffer, { 
    access: 'public', 
    contentType: 'image/jpeg' 
  });

  await pool.query(
    'INSERT INTO payments (fingerprint, method, tx_ref, cbe_screenshot_url, cbe_transfer_ref, status, amount) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [fingerprint, 'cbe', transferRef, blob.url, transferRef, 'pending', 150]
  );

  return blob.url;
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

    // GET /api/tiktok-stats
    if (url === '/api/tiktok-stats' && req.method === 'GET') {
      const { username } = params;
      if (!username) return res.status(400).json({ error: 'Username required' });

      try {
        const res = await axios.get(
          `https://www.tiktok.com/@${username.replace('@', '')}`,
          { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000 
          }
        );
        const html = res.data;
        const followerMatch = html.match(/"followerCount":\s*(\d+)/);
        const nameMatch = html.match(/"uniqueId":\s*"([^"]+)"/);

        return res.json({
          success: true,
          data: {
            username: username.replace('@', ''),
            followerCount: followerMatch ? parseInt(followerMatch[1]) : 0,
            name: nameMatch ? nameMatch[1] : username,
            platform: 'tiktok',
            isPrivate: html.includes('"privateAccount":true')
          }
        });
      } catch (err) {
        return res.json({
          success: true,
          data: {
            username: username.replace('@', ''),
            followerCount: 0,
            name: username,
            platform: 'tiktok',
            isPrivate: true,
            error: 'Could not fetch TikTok data - account may be private'
          }
        });
      }
    }

    // GET /api/trends
    if (url === '/api/trends' && req.method === 'GET') {
      const data = await getTrends();
      return res.json({ success: true, data });
    }

    // POST /api/ai-tools
    if (url === '/api/ai-tools' && req.method === 'POST') {
      const { tool, topic, content } = req.body;
      
      if (tool === 'caption') {
        if (!topic) return res.status(400).json({ error: 'Topic required' });
        const captions = await generateCaptions(topic);
        return res.json({ success: true, captions });
      }
      
      if (tool === 'virality' || tool === 'optimize') {
        if (!content) return res.status(400).json({ error: 'Content required' });
        const analysis = await analyzeContent(content);
        return res.json({ success: true, analysis });
      }
      
      return res.status(400).json({ error: 'Invalid tool' });
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

      const analysis = await analyzeContent(text);
      await pool.query('UPDATE users SET analyses_used = analyses_used + 1 WHERE fingerprint = $1', [fingerprint]);

      return res.json({
        success: true,
        analysis: analysis,
        remaining: user.is_premium ? 'unlimited' : Math.max(0, user.analyses_limit - user.analyses_used - 1)
      });
    }

    // POST /api/cbe-upload
    if (url === '/api/cbe-upload' && req.method === 'POST') {
      const { fingerprint, imageBase64, transferRef } = req.body;
      if (!fingerprint || !imageBase64 || !transferRef) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      if (!transferRef.startsWith('ET-CBE-')) {
        return res.status(400).json({ error: 'Invalid reference format' });
      }

      const existing = await pool.query('SELECT * FROM payments WHERE cbe_transfer_ref = $1', [transferRef]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Transfer reference already submitted' });
      }

      const url = await cbeUpload(fingerprint, transferRef, imageBase64);
      return res.json({ success: true, message: 'Screenshot uploaded! Admin will verify within 24 hours.', screenshotUrl: url });
    }

    // GET /api/test
    if (url === '/api/test' && req.method === 'GET') {
      return res.json({ 
        success: true, 
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // 404
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
