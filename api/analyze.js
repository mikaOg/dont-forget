const pool = require('../lib/db');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Get user status
  if (req.method === 'GET' && req.query.fingerprint) {
    try {
      const { fingerprint } = req.query;
      if (!fingerprint) return res.status(400).json({ error: 'Fingerprint required' });

      let userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
      let user = userRes.rows[0];
      if (!user) {
        await pool.query('INSERT INTO users (fingerprint) VALUES ($1)', [fingerprint]);
        userRes = await pool.query('SELECT * FROM users WHERE fingerprint = $1', [fingerprint]);
        user = userRes.rows[0];
      }
      res.json({
        success: true,
        user: {
          is_premium: user.is_premium,
          analyses_used: user.analyses_used || 0,
          analyses_limit: user.analyses_limit || 1,
          premium_expiry: user.premium_expiry
        }
      });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
  }

  // POST - Analyze content
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, fingerprint, trends = [] } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const cleanText = text.trim().substring(0, 2000);

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
          content: `You are an Ethiopian social media expert. Analyze content for virality on TikTok/Instagram/YouTube for Ethiopian audiences.
Return ONLY valid JSON with this exact structure:
{"score":0-100,"sentiment":"positive|neutral|negative","sentimentScore":0-100,"quality":"excellent|good|average|poor","topics":["topic1"],"tips":[{"icon":"emoji","text":"tip"}],"hashtags":["#Tag1"],"flagged":[],"bestTime":"7-9 PM EAT","platform":"TikTok"}`
        },
        {
          role: 'user',
          content: `Trends: ${(trends || []).slice(0,5).join(', ')}\n\nContent: "${cleanText}"`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    await pool.query('UPDATE users SET analyses_used = analyses_used + 1 WHERE fingerprint = $1', [fingerprint]);

    res.json({
      success: true,
      analysis: result,
      remaining: user.is_premium ? 'unlimited' : Math.max(0, user.analyses_limit - user.analyses_used - 1)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI analysis failed: ' + err.message });
  }
};
