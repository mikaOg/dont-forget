const Groq = require('groq-sdk');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tool, topic, content, trends = [], platform = 'tiktok' } = req.body;
    
    if (!tool) {
      return res.status(400).json({ error: 'Missing "tool" field' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY missing' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Caption Generator
    if (tool === 'caption') {
      if (!topic) return res.status(400).json({ error: 'Topic required' });
      
      const prompt = `You are an Ethiopian social media expert. Generate 5 engaging captions for ${platform} about "${topic}".
      
      Trending topics: ${(trends || []).slice(0, 5).join(', ')}
      
      Requirements:
      - Each caption under 80 characters
      - Include 2-3 relevant hashtags
      - Use emojis
      - Mix Amharic and English
      
      Return ONLY JSON array of 5 caption objects with: text, hashtags, vibe`;
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a creative social media caption writer.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.9,
        max_tokens: 500
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return res.json({ 
        success: true, 
        captions: Array.isArray(result) ? result.slice(0, 5) : result.captions?.slice(0, 5) || [],
        timestamp: new Date().toISOString()
      });
    }

    // Virality Analysis
    if (tool === 'virality') {
      if (!content) return res.status(400).json({ error: 'Content required' });
      
      const prompt = `Analyze this content for virality on ${platform} in Ethiopia:
      "${content}"
      Trends: ${(trends || []).slice(0, 5).join(', ')}
      
      Return JSON: { score, level: "High/Moderate/Low", sentiment, insights: [], bestTime, hashtags: [] }`;
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a viral content analyst for Ethiopia.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 400
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return res.json({ 
        success: true, 
        analysis: result,
        timestamp: new Date().toISOString()
      });
    }

    // Content Optimizer
    if (tool === 'optimize') {
      if (!content) return res.status(400).json({ error: 'Content required' });
      
      const prompt = `Optimize this caption for Ethiopian audiences:
      "${content}"
      
      Return JSON with 5 optimization tips (short actionable sentences)`;
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a social media optimization expert.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 300
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return res.json({ 
        success: true, 
        tips: Array.isArray(result) ? result : result.tips || [],
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({ error: 'Invalid tool' });

  } catch (err) {
    console.error('AI Tools error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
};
