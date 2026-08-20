const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, videoId } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'YouTube API key not configured'
      });
    }

    // Get video stats
    if (videoId) {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,statistics,contentDetails',
            id: videoId,
            key: apiKey
          }
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const video = response.data.items[0];
      return res.json({
        success: true,
        data: {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
          views: parseInt(video.statistics.viewCount || 0),
          likes: parseInt(video.statistics.likeCount || 0),
          comments: parseInt(video.statistics.commentCount || 0),
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          platform: 'youtube'
        }
      });
    }

    // Get channel stats
    if (!username) {
      return res.status(400).json({ 
        error: 'Please provide username or videoId' 
      });
    }

    // Search for channel
    const searchResponse = await axios.get(
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

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return res.status(404).json({ 
        error: 'Channel not found' 
      });
    }

    const channelId = searchResponse.data.items[0].snippet.channelId;

    // Get channel statistics
    const channelResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: apiKey
        }
      }
    );

    const channel = channelResponse.data.items[0];

    // Get recent videos
    const videosResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          channelId: channelId,
          order: 'date',
          maxResults: 10,
          key: apiKey
        }
      }
    );

    // Get video statistics
    const videoIds = videosResponse.data.items
      .map(item => item.id.videoId)
      .filter(id => id)
      .join(',');

    let videoStats = [];
    if (videoIds) {
      const statsResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'statistics',
            id: videoIds,
            key: apiKey
          }
        }
      );
      videoStats = statsResponse.data.items || [];
    }

    // Calculate engagement
    const recentVideos = videosResponse.data.items.slice(0, 5).map(item => {
      const stats = videoStats.find(v => v.id === item.id.videoId);
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        publishedAt: item.snippet.publishedAt,
        views: stats ? parseInt(stats.statistics.viewCount || 0) : 0,
        likes: stats ? parseInt(stats.statistics.likeCount || 0) : 0,
        comments: stats ? parseInt(stats.statistics.commentCount || 0) : 0
      };
    });

    const totalViews = recentVideos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = recentVideos.reduce((sum, v) => sum + v.likes, 0);
    const avgViews = recentVideos.length > 0 ? Math.round(totalViews / recentVideos.length) : 0;
    const engagementRate = avgViews > 0 
      ? ((totalLikes / recentVideos.length) / avgViews * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        id: channel.id,
        name: channel.snippet.title,
        username: channel.snippet.customUrl || channel.snippet.title,
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0),
        viewCount: parseInt(channel.statistics.viewCount || 0),
        description: channel.snippet.description || '',
        thumbnail: channel.snippet.thumbnails.default.url,
        country: channel.snippet.country || 'Unknown',
        createdAt: channel.snippet.publishedAt,
        recentVideos: recentVideos,
        averageViews: avgViews,
        engagementRate: parseFloat(engagementRate),
        platform: 'youtube',
        isVerified: false
      }
    });

  } catch (err) {
    console.error('YouTube API error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch YouTube stats',
      details: err.message
    });
  }
};