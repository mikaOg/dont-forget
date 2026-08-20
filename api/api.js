const pool = require('../lib/db');
const Groq = require('groq-sdk');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// CREATOR DATA - Full TikTok, YouTube, Instagram lists
// ============================================================

const tiktokCreators = [
  { id: 1, name: "Freedom", username: "@freedom", category: "tiktok", growth: -9.1, sentiment: 92, volume: "10.3M", data: [12, 18, 25, 32, 45, 58, 78, 95, 120, 156, 198, 245, 298, 342], desc: "The most-followed Ethiopian TikTok creator with 10.3M followers.", recentPost: "🎬 '10M followers! Thank you Ethiopia! 🇪🇹' — 3.2M views • 2 days ago", thumbnail: "https://picsum.photos/seed/freedom/400/225", videoUrl: "https://www.tiktok.com/@freedom", awards: "🏆 Top Creator 2025", verified: true },
  { id: 2, name: "Adonaymada", username: "@adonaymada", category: "tiktok", growth: 18.6, sentiment: 94, volume: "6.0M", data: [12, 18, 25, 32, 45, 58, 78, 95, 120, 156, 198, 245, 298, 342], desc: "Adonay Berhane — 'King of TikTok' in Ethiopia.", recentPost: "🎬 'Thank you for 6M followers! 🇪🇹' — 2.4M views • 3 days ago", thumbnail: "https://picsum.photos/seed/adonay/400/225", videoUrl: "https://www.tiktok.com/@adonaymada", awards: "🏆 TikToker of the Year 2025", verified: true },
  { id: 3, name: "Master Abinet Kebede", username: "@masterabinet", category: "tiktok", growth: 18.1, sentiment: 89, volume: "6.0M", data: [30, 45, 62, 85, 110, 140, 175, 210, 245, 267], desc: "One of Ethiopia's most followed TikTok creators.", recentPost: "🎬 'New challenge with the crew! 🔥' — 1.8M views • 5 days ago", thumbnail: "https://picsum.photos/seed/abinet/400/225", videoUrl: "https://www.tiktok.com/@masterabinet", awards: "🏆 Special Recognition 2025", verified: true },
  { id: 4, name: "SAMI (ፓፓ) ✝️", username: "@sami_papa", category: "tiktok", growth: 22.4, sentiment: 87, volume: "3.8M", data: [20, 28, 38, 50, 65, 80, 98, 112, 130, 145, 156], desc: "Popular Ethiopian content creator with strong engagement.", recentPost: "🎬 'Stay blessed, Ethiopia! 🙏' — 890K views • 4 days ago", thumbnail: "https://picsum.photos/seed/sami/400/225", videoUrl: "https://www.tiktok.com/@sami_papa", awards: "🌟 Rising Star 2025", verified: false },
  { id: 5, name: "Jon Daniel", username: "@jon_daniel", category: "tiktok", growth: 68.3, sentiment: 72, volume: "3.5M", data: [45, 52, 58, 65, 72, 85, 98, 112, 130, 145, 162, 178, 189], desc: "Popular Ethiopian TikToker with 3.5 million followers.", recentPost: "🎵 'Aychlem — New Ethiopian Music 🎤' — 1.2M views • 1 week ago", thumbnail: "https://picsum.photos/seed/jondaniel/400/225", videoUrl: "https://www.tiktok.com/@jon_daniel", awards: "🎵 Ethiopian Music Artist", verified: true },
  { id: 6, name: "አዊ ጄራ ቤር ዜንጋ", username: "@awi_jera", category: "tiktok", growth: 10.0, sentiment: 83, volume: "3.2M", data: [18, 22, 30, 40, 55, 68, 82, 98, 115, 130, 145], desc: "Rising Ethiopian TikTok star.", recentPost: "🎬 'Another day, another vibe ✨' — 620K views • 4 days ago", thumbnail: "https://picsum.photos/seed/awijera/400/225", videoUrl: "https://www.tiktok.com/@awi_jera", awards: "🌟 Rising Star", verified: false },
  { id: 7, name: "Yuti Nass", username: "@yuti_nass", category: "tiktok", growth: 20.3, sentiment: 91, volume: "3.0M", data: [15, 18, 22, 28, 35, 42, 55, 68, 82, 95, 108, 118, 128], desc: "Major Ethiopian TikTok creator, Lifetime Achievement Award.", recentPost: "🎬 'Grateful for all the love ❤️' — 1.5M views • 2 days ago", thumbnail: "https://picsum.photos/seed/yutinass/400/225", videoUrl: "https://www.tiktok.com/@yuti_nass", awards: "🏆 Lifetime Achievement Award", verified: true },
  { id: 8, name: "Tonkosu", username: "@tonkosu", category: "tiktok", growth: 10.9, sentiment: 85, volume: "3.0M", data: [20, 25, 30, 38, 48, 62, 75, 88, 102, 118, 135, 148, 156], desc: "Rising Ethiopian TikTok star with 3 million followers.", recentPost: "🎬 'Another day, another vibe ✨' — 890K views • 4 days ago", thumbnail: "https://picsum.photos/seed/tonkosu/400/225", videoUrl: "https://www.tiktok.com/@tonkosu", awards: "🌟 Rising Star", verified: false },
  { id: 9, name: "Eshetu Melese", username: "@eshetumelese", category: "tiktok", growth: -1.6, sentiment: 78, volume: "2.9M", data: [25, 28, 32, 38, 45, 52, 58, 65, 72, 78, 76], desc: "Ethiopian TikTok creator with 2.9M followers.", recentPost: "🎬 'Stay blessed, Ethiopia! 🙏' — 650K views • 6 days ago", thumbnail: "https://picsum.photos/seed/eshetu/400/225", videoUrl: "https://www.tiktok.com/@eshetumelese", awards: "🌟 Top Creator 2024", verified: false },
  { id: 10, name: "Dr. Abiy Tadesse", username: "@drabiy", category: "tiktok", growth: 14.9, sentiment: 96, volume: "2.8M", data: [30, 35, 40, 48, 55, 62, 70, 78, 85, 90, 95, 98], desc: "ENT surgeon with 2.8M followers. Health education.", recentPost: "🩺 'Health tips for Ethiopians' — 1.1M views • 3 days ago", thumbnail: "https://picsum.photos/seed/drabiy/400/225", videoUrl: "https://www.tiktok.com/@drabiy", awards: "🏆 Medical Content Award", verified: true },
  { id: 11, name: "Mensur Jemal", username: "@mensurjemal", category: "tiktok", growth: -4.3, sentiment: 82, volume: "2.7M", data: [25, 28, 32, 38, 45, 52, 58, 65, 72, 78, 76], desc: "Motivational content creator.", recentPost: "🎬 'Stay motivated, Ethiopia! 💪' — 720K views • 5 days ago", thumbnail: "https://picsum.photos/seed/mensur/400/225", videoUrl: "https://www.tiktok.com/@mensurjemal", awards: "🌟 Motivational Creator", verified: false },
  { id: 12, name: "ታኩር (Takur)", username: "@takur", category: "tiktok", growth: 43.7, sentiment: 88, volume: "2.6M", data: [22, 30, 42, 55, 68, 85, 102, 120, 142, 160, 178], desc: "Popular comedy creator.", recentPost: "😂 'New comedy skit!' — 980K views • 2 days ago", thumbnail: "https://picsum.photos/seed/takur/400/225", videoUrl: "https://www.tiktok.com/@takur", awards: "🌟 Comedy Star 2025", verified: false }
];

const instagramCreators = [
  { id: 101, name: "Danayit", username: "@danayit", category: "instagram", growth: 12.4, sentiment: 94, volume: "1.6M", data: [15, 20, 28, 35, 45, 58, 72, 88, 105, 120, 135, 148, 160], desc: "TV personality and influencer.", recentPost: "🎬 'New content coming soon! ✨' — 450K likes • 2 days ago", thumbnail: "https://picsum.photos/seed/danayit/400/225", videoUrl: null, awards: "🌟 TV Personality", verified: true },
  { id: 102, name: "Hanan Tarq Obid", username: "@hanan_tarq_obid", category: "instagram", growth: 8.7, sentiment: 91, volume: "1.4M", data: [12, 18, 25, 32, 42, 55, 68, 82, 98, 115, 130, 145], desc: "Prominent influencer.", recentPost: "📸 'Life moments with Hanan ✨' — 320K likes • 4 days ago", thumbnail: "https://picsum.photos/seed/hanan/400/225", videoUrl: null, awards: "🌟 Influencer", verified: true },
  { id: 103, name: "DJ Sinyorita", username: "@dj_sinyorita", category: "instagram", growth: 15.6, sentiment: 88, volume: "2.4M", data: [10, 15, 22, 30, 40, 52, 65, 78, 92, 108, 125, 140], desc: "Music content creator and DJ.", recentPost: "🎵 'New mix dropping soon! 🎶' — 280K likes • 3 days ago", thumbnail: "https://picsum.photos/seed/sinyorita/400/225", videoUrl: null, awards: "🌟 Music Creator", verified: true },
  { id: 104, name: "Sam Spov", username: "@samspov1", category: "instagram", growth: 6.2, sentiment: 89, volume: "632K", data: [8, 12, 18, 25, 35, 48, 60, 74, 88, 102, 118, 132], desc: "Lifestyle influencer.", recentPost: "📸 'Daily vibes ✨' — 250K likes • 5 days ago", thumbnail: "https://picsum.photos/seed/samspov/400/225", videoUrl: null, awards: "🌟 Lifestyle Creator", verified: false },
  { id: 105, name: "Lidiana Solomon", username: "@lidiana_solomon", category: "instagram", growth: 18.9, sentiment: 93, volume: "650K", data: [10, 15, 22, 30, 40, 52, 65, 78, 92, 108, 125, 140], desc: "Model and fashion influencer.", recentPost: "👗 'Ethiopian fashion style ✨' — 380K likes • 2 days ago", thumbnail: "https://picsum.photos/seed/lidiana/400/225", videoUrl: null, awards: "🌟 Model • Fashion", verified: false }
];

const youtubeCreators = [
  { id: 201, name: "Hope Music Ethiopia", username: "@HopeMusicEthiopia", category: "youtube", growth: 15.8, sentiment: 96, volume: "3.86M", data: [20, 28, 38, 50, 65, 80, 98, 112, 130, 145, 160, 175, 190], desc: "Most-followed Ethiopian YouTube channel.", recentPost: "🎵 'New Ethiopian music video 🎶' — 1.8M views • 3 days ago", thumbnail: "https://picsum.photos/seed/hopemusic/400/225", videoUrl: null, awards: "🏆 YouTube Creator of the Year", verified: true },
  { id: 202, name: "Donkey Tube", username: "@donkeytube.eshetumelese", category: "youtube", growth: 12.3, sentiment: 93, volume: "3.23M", data: [18, 25, 35, 48, 60, 75, 90, 108, 125, 140, 155, 170], desc: "Entertainment and comedy.", recentPost: "😂 'New comedy skit!' — 1.2M views • 4 days ago", thumbnail: "https://picsum.photos/seed/donkeytube/400/225", videoUrl: null, awards: "🌟 Comedy Creator", verified: true },
  { id: 203, name: "AlNojomia", username: "@AlNojomia", category: "youtube", growth: 18.2, sentiment: 95, volume: "2.67M", data: [15, 22, 32, 45, 58, 72, 88, 105, 122, 138, 155, 172], desc: "People & blogs.", recentPost: "📸 'New vlog! ✨' — 2.1M views • 2 days ago", thumbnail: "https://picsum.photos/seed/alnojomia/400/225", videoUrl: null, awards: "🏆 People & Blogs", verified: true }
];

const allCreators = [...tiktokCreators, ...instagramCreators, ...youtubeCreators];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ============================================================
// API ENDPOINTS
// ============================================================

// GET /api/creators
async function getCreators(platform = 'all', limit = 60) {
  let filtered = allCreators;
  if (platform !== 'all') {
    filtered = filtered.filter(c => c.category === platform);
  }
  return filtered.slice(0, limit);
}

// GET /api/youtube-stats
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

// GET /api/trends
async function getTrends() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let youtube = [], news = [], twitter = [];

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

// POST /api/ai-tools - Captions
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

// POST /api/ai-tools - Virality
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

// ============================================================
// MAIN HANDLER
// ============================================================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url.split('?')[0];
    const params = req.query || {};

    // GET /api/creators - Returns full creator list
    if (url === '/api/creators' && req.method === 'GET') {
      const { platform = 'all', limit = 60 } = params;
      const data = await getCreators(platform, parseInt(limit));
      return res.json({ success: true, data });
    }

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
