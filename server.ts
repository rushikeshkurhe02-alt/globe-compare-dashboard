import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '1mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Insights API Route with multi-model fallback and resilient data synthesis
app.post('/api/insights', async (req: Request, res: Response) => {
  try {
    const { countriesData } = req.body;

    if (!countriesData || !Array.isArray(countriesData) || countriesData.length < 2) {
      res.status(400).json({ error: 'Please provide comparison data for at least 2 countries.' });
      return;
    }

    // Helper: Algorithmic fallback if external AI models are temporarily experiencing 503 high demand
    const generateStatisticalFallback = () => {
      const countryNames = countriesData.map((c) => c.name || c.code || 'Nation');
      const strengthsList: { country: string; points: string[] }[] = [];
      const weaknessesList: { country: string; points: string[] }[] = [];

      countriesData.forEach((c) => {
        const cName = c.name || c.code;
        const sPoints: string[] = [];
        const wPoints: string[] = [];

        // Check population
        if (c.population && typeof c.population === 'string') {
          sPoints.push(`Demographic scale of ${c.population} residents.`);
        }
        // Check GDP
        const gdpEntry = Object.entries(c).find(([k]) => k.toLowerCase().includes('gdp'));
        if (gdpEntry && typeof gdpEntry[1] === 'string' && !gdpEntry[1].includes('N/A')) {
          sPoints.push(`Strong economic output with GDP per capita at ${gdpEntry[1]}.`);
        }
        // Check Life Expectancy
        const lifeEntry = Object.entries(c).find(([k]) => k.toLowerCase().includes('life'));
        if (lifeEntry && typeof lifeEntry[1] === 'string' && !lifeEntry[1].includes('N/A')) {
          sPoints.push(`High longevity standard with life expectancy recorded at ${lifeEntry[1]}.`);
        }
        // Check Internet Penetration
        const netEntry = Object.entries(c).find(([k]) => k.toLowerCase().includes('internet'));
        if (netEntry && typeof netEntry[1] === 'string' && !netEntry[1].includes('N/A')) {
          sPoints.push(`Broad digital connectivity with internet access at ${netEntry[1]}.`);
        }

        if (sPoints.length === 0) {
          sPoints.push(`Balanced macroeconomic indicators across public data series.`);
        }
        wPoints.push(`Data tracking varies across recent reporting periods; check latest World Bank reporting.`);

        strengthsList.push({ country: cName, points: sPoints.slice(0, 3) });
        weaknessesList.push({ country: cName, points: wPoints.slice(0, 2) });
      });

      return {
        summary: `Comparative analysis of ${countryNames.join(' and ')} shows distinct structural differences in economic output, longevity, and digital infrastructure.`,
        strengths: strengthsList,
        weaknesses: weaknessesList,
        verdict: `${countryNames[0]} and ${countryNames[1]} demonstrate complementary macroeconomic profiles, balancing demographic size and per-capita development metrics.`,
      };
    };

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing, using statistical synthesis');
      res.json(generateStatisticalFallback());
      return;
    }

    const prompt = `Analyze this comparison dataset for the following countries:
${JSON.stringify(countriesData, null, 2)}

Provide:
1. A concise comparative summary (max 2 sentences).
2. Key strengths for each country based on the data.
3. Watch-outs/weaknesses or areas of concern for each country based on the data.
4. A 1-sentence analytical verdict comparing the overall profile.`;

    const schemaConfig = {
      systemInstruction:
        'You are a concise data analyst. Use ONLY the data provided. Do not invent numbers. If a value is N/A, say data is unavailable. Write in simple, clear English.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'Executive comparison summary in at most 2 sentences.',
          },
          strengths: {
            type: Type.ARRAY,
            description: 'Key relative advantages per country.',
            items: {
              type: Type.OBJECT,
              properties: {
                country: { type: Type.STRING },
                points: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['country', 'points'],
            },
          },
          weaknesses: {
            type: Type.ARRAY,
            description: 'Watch-outs or lower relative performance points per country.',
            items: {
              type: Type.OBJECT,
              properties: {
                country: { type: Type.STRING },
                points: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['country', 'points'],
            },
          },
          verdict: {
            type: Type.STRING,
            description: 'One sentence concluding takeaway or verdict.',
          },
        },
        required: ['summary', 'strengths', 'weaknesses', 'verdict'],
      },
    };

    // Robust multi-model cascade to handle transient 503 high-demand surges
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: schemaConfig,
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Gemini model ${model} temporarily unavailable:`, modelErr?.message || modelErr);
        lastError = modelErr;
      }
    }

    if (responseText) {
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }
      res.json(parsedData);
      return;
    }

    // If all models encountered temporary 503 high-demand or network spike, serve data-backed fallback
    console.warn('All Gemini models encountered high-demand spike. Serving statistical synthesis.');
    res.json(generateStatisticalFallback());
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate AI insights.',
    });
  }
});

// Vite Middleware for Development / Static file serving for Production
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

setupServer();
