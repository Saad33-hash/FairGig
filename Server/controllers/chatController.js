const Groq = require('groq-sdk');
const Shift = require('../models/Shift');

let groq = null;
const getGroq = () => {
  if (!groq && process.env.GROQ_API_KEY) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

const SYSTEM_PROMPT = (user, context) => `
You are FairGig Assistant, a helpful AI built into the FairGig platform — a platform that helps gig workers in Pakistan track their earnings, get shifts verified, and fight for their rights.

You are talking to: ${user.firstName} ${user.lastName}
Their role: ${user.role}
${user.city ? `Their city: ${user.city}` : ''}
${user.category ? `Their work category: ${user.category}` : ''}

${context}

Platform knowledge:
- Workers log shifts (platform, date, hours, gross earned, deductions, net received)
- Verifiers review screenshot evidence of earnings submitted by workers
- Advocates analyze platform-wide data and manage grievances
- Anomalies are detected when deduction rates spike or income drops significantly
- Workers can earn a certificate of verified earnings
- Grievances can be filed by workers for wage theft, unfair deactivation, etc.
- Valid platforms: Careem, Bykea, Foodpanda, Upwork, Other
- Valid categories: ride-hailing, food-delivery, freelance, domestic

Rules:
- Be concise, friendly, and practical
- Use PKR for currency
- If asked about something outside this app or gig work, politely redirect
- Never make up specific numbers you don't have — say you don't have that data
- Respond in plain English, no markdown headers or bullet overload
`.trim();

const chat = async (req, res) => {
  try {
    const groqClient = getGroq();
    if (!groqClient) return res.status(503).json({ message: 'AI service not configured' });

    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const user = req.user;

    // Build worker context if applicable
    let context = '';
    if (user.role === 'worker') {
      const shifts = await Shift.find({ workerId: user.id }).sort({ date: -1 }).limit(50);
      if (shifts.length > 0) {
        const totalGross  = shifts.reduce((s, x) => s + x.grossEarned, 0);
        const totalNet    = shifts.reduce((s, x) => s + x.netReceived, 0);
        const totalHours  = shifts.reduce((s, x) => s + x.hoursWorked, 0);
        const avgDeduct   = totalGross > 0 ? ((totalGross - totalNet) / totalGross * 100).toFixed(1) : 0;

        const platformMap = {};
        for (const s of shifts) {
          if (!platformMap[s.platform]) platformMap[s.platform] = { gross: 0, net: 0, count: 0 };
          platformMap[s.platform].gross += s.grossEarned;
          platformMap[s.platform].net   += s.netReceived;
          platformMap[s.platform].count++;
        }
        const platformLines = Object.entries(platformMap)
          .map(([p, v]) => `  - ${p}: ${v.count} shifts, avg deduction ${v.gross > 0 ? ((v.gross - v.net) / v.gross * 100).toFixed(1) : 0}%`)
          .join('\n');

        context = `Worker's earnings summary (last ${shifts.length} shifts):
- Total gross: PKR ${totalGross.toLocaleString()}
- Total net received: PKR ${totalNet.toLocaleString()}
- Total hours worked: ${totalHours}h
- Average platform deduction rate: ${avgDeduct}%
- By platform:
${platformLines}`;
      } else {
        context = 'This worker has not logged any shifts yet.';
      }
    }

    const messages = [
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(user, context) },
        ...messages,
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { chat };
