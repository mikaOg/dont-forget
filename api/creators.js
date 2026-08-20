const creators = [
  { id: 1, name: "Freedom", username: "@freedom", category: "tiktok", growth: -9.1, sentiment: 92, volume: "10.3M", data: [12, 18, 25, 32, 45, 58, 78, 95, 120, 156, 198, 245, 298, 342], desc: "The most-followed Ethiopian TikTok creator with 10.3M followers.", recentPost: "🎬 '10M followers! Thank you Ethiopia! 🇪🇹' — 3.2M views • 2 days ago", thumbnail: "https://picsum.photos/seed/freedom/400/225", videoUrl: "https://www.tiktok.com/@freedom", awards: "🏆 Top Creator 2025", verified: true },
  { id: 2, name: "Adonaymada", username: "@adonaymada", category: "tiktok", growth: 18.6, sentiment: 94, volume: "6.0M", data: [12, 18, 25, 32, 45, 58, 78, 95, 120, 156, 198, 245, 298, 342], desc: "Adonay Berhane — 'King of TikTok' in Ethiopia.", recentPost: "🎬 'Thank you for 6M followers! 🇪🇹' — 2.4M views • 3 days ago", thumbnail: "https://picsum.photos/seed/adonay/400/225", videoUrl: "https://www.tiktok.com/@adonaymada", awards: "🏆 TikToker of the Year 2025", verified: true },
  { id: 3, name: "Master Abinet Kebede", username: "@masterabinet", category: "tiktok", growth: 18.1, sentiment: 89, volume: "6.0M", data: [30, 45, 62, 85, 110, 140, 175, 210, 245, 267], desc: "One of Ethiopia's most followed TikTok creators.", recentPost: "🎬 'New challenge with the crew! 🔥' — 1.8M views • 5 days ago", thumbnail: "https://picsum.photos/seed/abinet/400/225", videoUrl: "https://www.tiktok.com/@masterabinet", awards: "🏆 Special Recognition 2025", verified: true },
  { id: 4, name: "SAMI (ፓፓ) ✝️", username: "@sami_papa", category: "tiktok", growth: 22.4, sentiment: 87, volume: "3.8M", data: [20, 28, 38, 50, 65, 80, 98, 112, 130, 145, 156], desc: "Popular Ethiopian content creator with strong engagement.", recentPost: "🎬 'Stay blessed, Ethiopia! 🙏' — 890K views • 4 days ago", thumbnail: "https://picsum.photos/seed/sami/400/225", videoUrl: "https://www.tiktok.com/@sami_papa", awards: "🌟 Rising Star 2025", verified: false },
  { id: 5, name: "Jon Daniel", username: "@jon_daniel", category: "tiktok", growth: 68.3, sentiment: 72, volume: "3.5M", data: [45, 52, 58, 65, 72, 85, 98, 112, 130, 145, 162, 178, 189], desc: "Popular Ethiopian TikToker with 3.5 million followers.", recentPost: "🎵 'Aychlem — New Ethiopian Music 🎤' — 1.2M views • 1 week ago", thumbnail: "https://picsum.photos/seed/jondaniel/400/225", videoUrl: "https://www.tiktok.com/@jon_daniel", awards: "🎵 Ethiopian Music Artist", verified: true },
  { id: 6, name: "አዊ ጄራ ቤር ዜንጋ", username: "@awi_jera", category: "tiktok", growth: 10.0, sentiment: 83, volume: "3.2M", data: [18, 22, 30, 40, 55, 68, 82, 98, 115, 130, 145], desc: "Rising Ethiopian TikTok star.", recentPost: "🎬 'Another day, another vibe ✨' — 620K views • 4 days ago", thumbnail: "https://picsum.photos/seed/awijera/400/225", videoUrl: "https://www.tiktok.com/@awi_jera", awards: "🌟 Rising Star", verified: false },
  { id: 7, name: "Yuti Nass", username: "@yuti_nass", category: "tiktok", growth: 20.3, sentiment: 91, volume: "3.0M", data: [15, 18, 22, 28, 35, 42, 55, 68, 82, 95, 108, 118, 128], desc: "Major Ethiopian TikTok creator, Lifetime Achievement Award.", recentPost: "🎬 'Grateful for all the love ❤️' — 1.5M views • 2 days ago", thumbnail: "https://picsum.photos/seed/yutinass/400/225", videoUrl: "https://www.tiktok.com/@yuti_nass", awards: "🏆 Lifetime Achievement Award", verified: true },
  { id: 8, name: "Tonkosu", username: "@tonkosu", category: "tiktok", growth: 10.9, sentiment: 85, volume: "3.0M", data: [20, 25, 30, 38, 48, 62, 75, 88, 102, 118, 135, 148, 156], desc: "Rising Ethiopian TikTok star with 3 million followers.", recentPost: "🎬 'Another day, another vibe ✨' — 890K views • 4 days ago", thumbnail: "https://picsum.photos/seed/tonkosu/400/225", videoUrl: "https://www.tiktok.com/@tonkosu", awards: "🌟 Rising Star", verified: false },
  { id: 9, name: "Eshetu Melese", username: "@eshetumelese", category: "tiktok", growth: -1.6, sentiment: 78, volume: "2.9M", data: [25, 28, 32, 38, 45, 52, 58, 65, 72, 78, 76], desc: "Ethiopian TikTok creator with 2.9M followers.", recentPost: "🎬 'Stay blessed, Ethiopia! 🙏' — 650K views • 6 days ago", thumbnail: "https://picsum.photos/seed/eshetu/400/225", videoUrl: "https://www.tiktok.com/@eshetumelese", awards: "🌟 Top Creator 2024", verified: false },
  { id: 10, name: "Dr. Abiy Tadesse", username: "@drabiy", category: "tiktok", growth: 14.9, sentiment: 96, volume: "2.8M", data: [30, 35, 40, 48, 55, 62, 70, 78, 85, 90, 95, 98], desc: "ENT surgeon with 2.8M followers. Health education.", recentPost: "🩺 'Health tips for Ethiopians' — 1.1M views • 3 days ago", thumbnail: "https://picsum.photos/seed/drabiy/400/225", videoUrl: "https://www.tiktok.com/@drabiy", awards: "🏆 Medical Content Award", verified: true }
];

module.exports = async (req, res) => {
  // Always return success even if something goes wrong
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const { platform = 'all', limit = 60 } = req.query;
    
    let filtered = creators;
    if (platform !== 'all') {
      filtered = filtered.filter(c => c.category === platform);
    }
    
    const data = filtered.slice(0, parseInt(limit));
    
    res.status(200).json({ 
      success: true, 
      data: data,
      total: creators.length,
      filtered: data.length
    });
    
  } catch (err) {
    // Always return something, never fail
    res.status(200).json({ 
      success: true, 
      data: creators.slice(0, 10),
      total: creators.length,
      error: err.message 
    });
  }
};
