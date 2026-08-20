const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.replace('@', '');
    
    // Fetch TikTok profile
    const response = await axios.get(
      `https://www.tiktok.com/@${cleanUsername}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      }
    );

    const html = response.data;
    
    // Extract data from page
    const dataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
    let userData = null;
    
    if (dataMatch) {
      try {
        const jsonData = JSON.parse(dataMatch[1]);
        userData = jsonData?.props?.pageProps?.userInfo?.user || 
                   jsonData?.props?.pageProps?.userInfo?.userInfo?.user;
      } catch {}
    }

    if (!userData) {
      const followerMatch = html.match(/"followerCount":\s*(\d+)/);
      const followingMatch = html.match(/"followingCount":\s*(\d+)/);
      const videoMatch = html.match(/"videoCount":\s*(\d+)/);
      const nameMatch = html.match(/"uniqueId":\s*"([^"]+)"/);
      
      userData = {
        id: 'unknown',
        unique_id: nameMatch ? nameMatch[1] : cleanUsername,
        follower_count: followerMatch ? parseInt(followerMatch[1]) : 0,
        following_count: followingMatch ? parseInt(followingMatch[1]) : 0,
        video_count: videoMatch ? parseInt(videoMatch[1]) : 0,
        signature: html.match(/"signature":\s*"([^"]+)"/)?.[1] || '',
        avatar_thumb: html.match(/"avatarThumb":\s*"([^"]+)"/)?.[1] || '',
        verified: html.includes('"verified":true')
      };
    }

    if (!userData || !userData.unique_id) {
      return res.status(404).json({ 
        error: 'User not found or account is private'
      });
    }

    const stats = {
      id: userData.id || 'unknown',
      name: userData.unique_id || cleanUsername,
      displayName: userData.nickname || userData.unique_id || cleanUsername,
      username: userData.unique_id || cleanUsername,
      followerCount: userData.follower_count || 0,
      followingCount: userData.following_count || 0,
      videoCount: userData.video_count || 0,
      isVerified: userData.verified || false,
      isPrivate: userData.private_account || false,
      biography: userData.signature || '',
      avatar: userData.avatar_thumb || userData.avatar_larger || '',
      platform: 'tiktok',
      lastUpdated: new Date().toISOString()
    };

    if (stats.isPrivate) {
      return res.json({
        success: true,
        data: stats,
        note: 'This account is private. Limited data available.'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('TikTok API error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch TikTok stats',
      details: err.message
    });
  }
};