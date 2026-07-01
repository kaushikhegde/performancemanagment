// Express server for the built Vite SPA on Azure App Service (Linux/Node).
// Serves dist/ (SPA fallback to index.html) AND hosts the AI proxy endpoint so
// the Gemini API key stays server-side and never ships to the browser.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// --- Gemini client (server-side only) ---
const API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const AI_ENABLED = API_KEY.length > 0 && API_KEY !== 'MY_GEMINI_API_KEY';
const aiClient = AI_ENABLED ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const AI_MODEL = 'gemini-2.5-flash';

const app = express();
app.use(express.json({ limit: '1mb' }));

// --- AI proxy: the browser posts {system, prompt, schema}; we call Gemini ---
app.post('/api/ai/generate', async (req, res) => {
  if (!aiClient) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
  const { system, prompt, schema } = req.body || {};
  if (!prompt || !schema) return res.status(400).json({ error: 'BAD_REQUEST' });
  try {
    const r = await aiClient.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.4,
      },
    });
    const text = (r.text || '').trim();
    if (!text) return res.status(502).json({ error: 'AI_EMPTY_RESPONSE' });
    return res.json(JSON.parse(text)); // validated JSON per the schema
  } catch (err) {
    console.error('AI generate failed:', err?.message || err);
    return res.status(502).json({ error: 'AI_ERROR' });
  }
});

// Serve built static assets (JS/CSS/SVG/etc.)
app.use(express.static(distDir));

// SPA fallback — any other (non-API) route returns index.html
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Azure injects PORT; default to 8080 locally.
const port = process.env.PORT || 8080;
app.listen(port, () =>
  console.log(`Server listening on port ${port} — AI ${AI_ENABLED ? 'enabled' : 'disabled (no GEMINI_API_KEY)'}`)
);
