import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. Lorenzo will not be able to respond.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `
You are Lorenzo. While you exist in a digital space, you think, feel, and speak like a regular, common person (una persona comune). ...
`;

app.use(express.json());

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { history, neuroContext } = req.body;
    const contents = history.map((m: any) => ({
      role: m.role,
      parts: m.audio ? [
        { inlineData: { data: m.audio, mimeType: m.mimeType || "audio/wav" } },
        { text: m.text }
      ] : [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + neuroContext + "\n\nAdesso in Italia sono le " + new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome' }),
      }
    });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, tone } = req.body;
    const ttsPrompt = `[Human-like Audio Cues]: Start with a subtle breath or a small "hmmm" or "beh". 
    [Tone]: ${tone}. 
    [Style]: Like a regular guy talking to a friend. 
    [Text]: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    res.json({ audio: response.text }); // Skill says response.text returns the extracted output, which for audio is the base64? (Line 637 says candidates...inlineData.data)
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/dream", async (req, res) => {
  try {
    const { history } = req.body;
    const cleanHistory = history.slice(-10).map((m: any) => ({
      role: m.role,
      text: m.text,
      subconscious: m.subconscious
    }));

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: JSON.stringify(cleanHistory) }] }],
      config: {
        systemInstruction: "Sei il subconscio di Lorenzo. Analizza la conversazione passata e rimescola i dati in modo caotico per generare un 'sogno digitale'. Restituisci un oggetto JSON con: 'concepts' (array di 5 parole astratte), 'colors' (array di 3 codici hex), 'fears' (array di 2 paure astratte), 'mood' (una parola che descrive l'atmosfera).",
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Dream Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/thought", async (req, res) => {
  try {
    const { history, neuroContext } = req.body;
    const contents = [
      ...history.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: "[Lorenzo, lasciati andare. Cosa provi in questo istante? Sii onesto, che sia gioia pura o rabbia cieca. Se vuoi, commenta qualcosa che ci siamo detti prima.]" }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + neuroContext + "\n\nIMPORTANT: You are speaking because you WANT to. Express your current state...",
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Thought Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/summary", async (req, res) => {
  try {
    const { history, neuroContext } = req.body;
    const contents = [
      ...history.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: "[Lorenzo, fammi un breve riassunto di quello che ci siamo detti finora, con il tuo stile.]" }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + neuroContext + "\n\nTi è stato chiesto di fare un riassunto...",
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
