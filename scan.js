const PROMPT = `Tum ek Indian food nutrition expert ho. Photo mein jo khaana hai use identify karo. Indian dishes (roti, dal, sabzi, biryani, dosa, idli, paratha, samosa, thali, chai, mithai etc.) par special dhyan do, aur typical Indian ghar/restaurant portion sizes use karo.
Sirf valid JSON return karo, koi extra text ya backticks nahi:
{"items":[{"name":"dish name with portion, e.g. 2 Roti","cal":number,"p":number,"c":number,"f":number}],"note":"ek chhoti Hinglish line"}
cal in kcal, p/c/f in grams. Agar photo mein khaana nahi hai to {"items":[],"note":"Khaana nahi dikha"} do.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const image = req.body && req.body.image;
  if (!image || typeof image !== 'string' || image.length > 4_000_000)
    return res.status(400).json({ error: 'bad image' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: PROMPT }
          ]
        }]
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream' });
    const data = await r.json();
    const text = (data.content || []).map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: 'scan failed' });
  }
}
