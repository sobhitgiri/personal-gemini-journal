import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy GoogleGenAI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please configure it in your secrets.');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper: generateContentWithFallback
 * Wraps generation with fallback ladder catching recoverable HTTP/API codes
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  systemInstruction: string,
  contents: any[]
): Promise<FallbackResult> {
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          text: responseText,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || err?.code;
      const message = String(err?.message || '');
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        message.includes('UNAVAILABLE') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('NOT_FOUND') ||
        message.includes('INTERNAL');

      console.warn(`Attempt with model ${model} failed (recoverable=${isRecoverable}):`, message);

      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(model) === 0) {
        // Continue fallback even for other non-fatal errors to be resilient
      }
    }
  }

  throw new Error(
    `All models in fallback ladder exhausted. Last error: ${lastError?.message || 'Unknown generation failure'}`
  );
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Mode instruction definitions
const MODE_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  reflection:
    'You are an empathetic, insightful reflection companion. Analyze the user’s personal journal entry. Validate their feelings with warmth, highlight unconscious themes or patterns, offer gentle reframing, and conclude with one thoughtful self-reflection question. Use clear Markdown with headings and bullet points.',
  brainstorm:
    'You are a creative, strategic thinking partner. Take the user’s notes or dilemma and generate 4-6 distinct, creative angles, innovative solutions, and practical micro-experiments. Format with clean Markdown, bold headers, and actionable steps.',
  summary:
    'You are an executive summary specialist for personal reflections. Synthesize the provided thoughts into: 1. Core Essence (1 sentence), 2. Key Themes & Emotions (bulleted), 3. Decisions & Takeaways, and 4. Suggested Focus for Tomorrow. Keep it structured and scannable.',
  converse:
    'You are a supportive conversational dialogue partner. Continue the multi-turn discussion naturally, referencing past context in the thread, answering questions, and fostering deep clarity. Speak with clarity, respect, and emotional intelligence.',
};

// API endpoint to generate reflection / multi-turn dialogue
app.post('/api/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' && MODE_SYSTEM_INSTRUCTIONS[body.mode] ? body.mode : 'reflection';
    const history = Array.isArray(body.history) ? body.history : [];
    const currentTitle = typeof body.title === 'string' ? body.title.trim() : '';

    if (!prompt) {
      res.status(400).json({ error: 'Prompt content is required.' });
      return;
    }

    if (prompt.length > 10000) {
      res.status(400).json({ error: 'Journal prompt exceeds maximum limit of 10,000 characters.' });
      return;
    }

    const ai = getGenAI();
    const systemInstruction = MODE_SYSTEM_INSTRUCTIONS[mode];

    // Build multi-turn contents format for @google/genai
    const contents: any[] = [];

    for (const item of history) {
      if (item && typeof item === 'object' && item.text) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: String(item.text) }],
        });
      }
    }

    // Add current prompt as the latest user turn
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    // Execute with fallback ladder
    const result = await generateContentWithFallback(ai, systemInstruction, contents);

    // Optional: Generate concise title if not provided or empty
    let generatedTitle = currentTitle;
    if (!generatedTitle) {
      try {
        const titlePrompt = `Provide a concise, poetic 3-6 word title for this journal entry. Return ONLY the title text, with no quotation marks or markdown:\n\n"${prompt.slice(0, 300)}"`;
        const titleResult = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: titlePrompt }] }],
          config: { temperature: 0.4 },
        });
        const cleanTitle = (titleResult.text || '').replace(/["'\n\r]/g, '').trim();
        if (cleanTitle.length > 0 && cleanTitle.length <= 80) {
          generatedTitle = cleanTitle;
        } else {
          generatedTitle = prompt.slice(0, 40) + '...';
        }
      } catch (err) {
        generatedTitle = prompt.slice(0, 40) + '...';
      }
    }

    res.json({
      aiResponse: result.text,
      modelUsed: result.modelUsed,
      title: generatedTitle,
      mode,
    });
  } catch (error: any) {
    console.error('Error in /api/reflect:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini API.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
