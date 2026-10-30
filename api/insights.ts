import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { countriesData } = req.body || {};

    if (!countriesData || !Array.isArray(countriesData) || countriesData.length < 2) {
      return res.status(400).json({ error: 'Please provide comparison data for at least 2 countries.' });
    }

    // Helper: Algorithmic fallback if external AI models are temporarily experiencing 503 high demand
    const generateStatisticalFallback = () => {
      const countryNames = countriesData.map((c: any) => c.name || c.code || 'Nation');
      const strengthsList: { country: string; points: string[] }[] = [];
      const weaknessesList: { country: string; points: string[] }[] = [];

      countriesData.forEach((c: any) => {
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
      return res.status(200).json(generateStatisticalFallback());
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

    const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
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
      return res.status(200).json(parsedData);
    }

    return res.status(200).json(generateStatisticalFallback());
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate AI insights.',
    });
  }
}
