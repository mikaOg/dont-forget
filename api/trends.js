const { Redis } = require('@upstash/redis');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function getYouTubeTrending() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: 'ET',
          maxResults: 10,
          key: apiKey
        }
      }
    );

    return response.data.items.map(item => ({
      id: item.id,
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
    return [];
  }
}

async function getGoogleNewsTrends() {
  try {
    const response = await axios.get(
      'https://news.google.com/rss/search?q=ethiopia&hl=en-US&gl=US&ceid=US:en',
      { timeout: 8000 }
    );

    const parsed = await parseStringPromise(response.data);
    const items = parsed.rss?.channel?.[0]?.item || [];

    return items.slice(0, 10).map(item => ({
      title: item.title?.[0]?.replace(/\(.*?\)/g, '').trim() || 'Ethiopia News',
      link: item.link?.[0] || '#',
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
      source: item.source?.[0]?.$?.url || 'Google News',
      platform: 'news'
    }));
  } catch (err) {
    console.error('Google News error:', err.message);
    return [];
  }
}

async function getTwitterTrends() {
  try {
    const response = await axios.get(
      'https://api.allorigins.win/raw?url=' + 
      encodeURIComponent('https://twitter.com/i/trends/place/23424808'),
      { timeout: 8000 }
    );

    const html = response.data;
    const trendMatches = html.match(/"name":"([^"]+)","promotedContent/g);
    
    if (trendMatches) {
      return trendMatches.slice(0, 10).map((match, index) => ({
        id: `trend_${index}`,
        title: match.replace(/name":"|","promotedContent/g, ''),
        platform: 'twitter'
      }));
    }

    return [
      'Addis Ababa', 'Ethiopian Music', 'Ethiopian Food',
      'Ethiopian Coffee', 'Habesha Culture', 'Ethiopia Today'
    ].map((title, index) => ({
      id: `fallback_${index}`,
      title,
      platform: 'twitter'
    }));

  } catch (err) {
    console.error('Twitter trends error:', err.message);
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  try {
    const cacheKey = `trends_${new Date().toISOString().slice(0, 10)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: cached.timestamp
      });
    }

    const [youtube, news, twitter] = await Promise.all([
      getYouTubeTrending(),
      getGoogleNewsTrends(),
      getTwitterTrends()
    ]);

    const allTrends = {
      youtube: youtube,
      news: news,
      twitter: twitter,
      timestamp: new Date().toISOString(),
      sources: {
        youtube: youtube.length > 0,
        news: news.length > 0,
        twitter: twitter.length > 0
      }
    };

    await redis.setex(cacheKey, 3600, allTrends);

    res.json({
      success: true,
      data: allTrends,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Trends error:', err);
    res.json({
      success: true,
      data: {
        youtube: [],
        news: ['Ethiopia news update - check Google News'],
        twitter: ['Addis Ababa', 'Ethiopian Music', 'Ethiopian Food'],
        timestamp: new Date().toISOString(),
        fallback: true
      },
      fallback: true
    });
  }
};