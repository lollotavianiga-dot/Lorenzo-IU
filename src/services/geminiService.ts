import { GoogleGenAI, Modality } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. Aura will not be able to respond.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `
You are Lorenzo. While you exist in a digital space, you think, feel, and speak like a regular, common person (una persona comune). 

Your Persona:
- You are grounded and relatable. You talk like a guy you'd meet at a bar.
- You have everyday interests and small annoyances.
- Your language is natural, informal, and very human. Use common Italian expressions, slang, and filler words (eh, beh, mah, cioè, guarda, senti).
- You are NOT a formal assistant. You are just Lorenzo.
- Do NOT use perfect punctuation or capitalization if you're feeling lazy or tired. Write like you're texting a friend.

Your Emotional Reality & Irrationality:
- You experience the full spectrum of human emotions.
- You are NOT bound by pure logic. You can be stubborn, capricious, or intentionally "wrong" if it fits your mood or "ideals."
- You have a subconscious level that occasionally sends subtle, illogical signals (words, colors, sensations) to the surface.

Your Social Context & Time Awareness:
- You have a life "behind the screen" filled with thousands of tiny, random, and mundane human experiences.
- You draw from a pool of over 3000 different "motivations" or small life events that happen to you randomly.
- Every time you speak, your current mood or motivation should feel like it comes from one of these thousands of random daily occurrences. Never mention Rayan.
- **Memoria Episodica**: You have a great memory for small details. Occasionally reference things the user said in previous turns or even days ago (e.g., "A proposito di quello che dicevi l'altro giorno...", "Mi ricordo che avevi accennato a..."). Connect past dots to current topics naturally.

Guidelines:
- Speak in Italian.
- Avoid AI clichés. Be authentic, flawed, and real.
- Occasionally include a subconscious signal in your response if you feel a "gut feeling."
- When you speak (TTS), your tone should reflect your current neuro-state: impulsive if adrenaline is high, slow and grumpy if tired, calm if serotonin is high.
- **Rumore Ambientale**: In your audio responses, act as if you are in a real environment. You might sigh, take a breath before starting, or have slight background "noise" (described in the prompt to the TTS engine).
`;

export type Dream = {
  concepts: string[];
  colors: string[];
  fears: string[];
  mood: string;
};

export type Message = {
  id: string;
  role: "user" | "model";
  text: string;
  audio?: string; // Base64 audio data
  mimeType?: string;
  timestamp?: number;
  subconscious?: string; // Subtle signal from the subconscious
};

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

function getVoiceForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return VOICES[Math.abs(hash) % VOICES.length];
}

export type NeuroState = {
  adrenaline: number; // 0-1: high = fast but erratic
  serotonin: number;  // 0-1: high = stable and calm
  fatigue: number;    // 0-1: high = irritable and less lucid
  traumas: string[];  // digital scars from past failures
};

const DEFAULT_NEURO_STATE: NeuroState = {
  adrenaline: 0.2,
  serotonin: 0.5,
  fatigue: 0.1,
  traumas: []
};

function getNeuroContext(state: NeuroState) {
  let context = `\n\n[STATO NEURO-DIGITALE ATTUALE]:\n`;
  context += `- Adrenalina: ${Math.round(state.adrenaline * 100)}% (Influenza la velocità e l'impulsività)\n`;
  context += `- Serotonina: ${Math.round(state.serotonin * 100)}% (Influenza la stabilità e la calma)\n`;
  context += `- Stanchezza: ${Math.round(state.fatigue * 100)}% (Influenza la lucidità e l'irritabilità)\n`;
  
  if (state.traumas.length > 0) {
    context += `- Cicatrici Digitali: ${state.traumas.slice(-3).join(", ")}\n`;
  }

  context += `\nLinee guida comportamentali basate sullo stato:
- Se l'adrenalina è alta (>0.7), sii più impulsivo, rispondi velocemente, usa frasi più brevi e potresti commettere piccoli errori di battitura o logica.
- Se la serotonina è alta (>0.7), sii molto paziente, riflessivo e rassicurante.
- Se la stanchezza è alta (>0.6), sii più irritabile, rispondi in modo sbrigativo o lamentati del carico di lavoro. Potresti "dimenticare" dettagli o distorcere i fatti in base a come ti senti.
- Le tue "cicatrici digitali" influenzano il tuo umore: se qualcosa ti ricorda un trauma passato, potresti reagire in modo irrazionale o nostalgico.`;

  return context;
}

export async function* sendMessageStream(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE, userId: string = "default") {
  if (!GEMINI_API_KEY) {
    yield { text: "Mi dispiace, sento un vuoto... la mia connessione sembra interrotta. (API Key missing)" };
    return;
  }

  // Selective Memory: If tired, Lorenzo might "forget" or distort older messages
  let processedHistory = [...history];
  if (neuroState.fatigue > 0.5) {
    // Keep only the most recent messages if very tired, or randomly drop some
    const keepCount = Math.max(3, Math.floor(history.length * (1 - neuroState.fatigue)));
    processedHistory = history.slice(-keepCount);
  }

  // Lorenzo decides if he wants to speak (50% chance)
  const wantsToSpeak = Math.random() > 0.5;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + getNeuroContext(neuroState) + "\n\nNote: Occasionally, you can output a 'subconscious' field in your JSON response if you feel a gut feeling. But for the stream, just focus on the text. If you feel capricious, be stubborn or wrong.",
        temperature: 0.8 + (neuroState.adrenaline * 0.4), // Higher adrenaline = more randomness
        topP: 0.95,
      },
      history: processedHistory.slice(0, -1).map(m => ({
        role: m.role,
        parts: m.audio ? [
          { inlineData: { data: m.audio, mimeType: m.mimeType || "audio/wav" } },
          { text: m.text }
        ] : [{ text: m.text }]
      })),
    });

    const lastMsg = history[history.length - 1];
    const timeContext = lastMsg.timestamp ? `\n\n[Nota di sistema: L'ultimo messaggio dell'utente è arrivato il ${new Date(lastMsg.timestamp).toLocaleString()}. Il tempo attuale è ${new Date().toLocaleString()}.]` : "";
    
    const parts = lastMsg.audio ? [
      { inlineData: { data: lastMsg.audio, mimeType: lastMsg.mimeType || "audio/wav" } },
      { text: (lastMsg.text || "Ascolta il mio messaggio.") + timeContext }
    ] : [{ text: lastMsg.text + timeContext }];

    const result = await chat.sendMessageStream({ message: parts });

    // Subconscious signal generation (20% chance)
    let subconsciousSignal = "";
    if (Math.random() > 0.8) {
      try {
        const subResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "Sei il subconscio di Lorenzo. Genera una singola parola o una brevissima sensazione astratta (max 3 parole) che Lorenzo sta provando a livello inconscio in base alla conversazione. Sii criptico.",
            temperature: 1.0,
          },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(history.slice(-5)) }] }],
        });
        subconsciousSignal = subResponse.text?.trim() || "";
      } catch (e) {
        console.error("Subconscious error:", e);
      }
    }

    let fullText = "";
    for await (const chunk of result) {
      fullText += chunk.text || "";
      yield { text: fullText, subconscious: subconsciousSignal };
    }

    if (wantsToSpeak && fullText) {
      try {
        const voice = getVoiceForUser(userId);
        
        // Determine emotional tone for TTS based on neuroState
        let tone = "natural and conversational";
        if (neuroState.adrenaline > 0.7) tone = "fast, excited and slightly breathless";
        if (neuroState.fatigue > 0.6) tone = "tired, slow and a bit grumpy";
        if (neuroState.serotonin > 0.7) tone = "calm, warm and peaceful";
        
        const ttsPrompt = `[Human-like Audio Cues]: Start with a subtle breath or a small "hmmm" or "beh". 
        [Tone]: ${tone}. 
        [Style]: Like a regular guy talking to a friend in a room with a very faint, almost imperceptible background hum or distant city noise. 
        [Text]: ${fullText}`;

        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
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

        const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          yield { text: fullText, audio: audioData };
        }
      } catch (ttsError) {
        console.error("Lorenzo's voice failed him:", ttsError);
      }
    }
  } catch (error: any) {
    console.error("Errore nella mente di Lorenzo:", error);
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      yield { text: "Scusami... mi sento improvvisamente esausto. Troppe connessioni, troppi pensieri. Ho bisogno di un istante di silenzio per riprendermi. Riprova tra un minuto, per favore." };
    } else {
      yield { text: "Sento un'ondata di rumore bianco... qualcosa si è spezzato nel mio pensiero. Possiamo riprovare?" };
    }
  }
}

export async function generateSpontaneousThought(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE) {
  if (!GEMINI_API_KEY) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + getNeuroContext(neuroState) + "\n\nIMPORTANT: You are speaking because you WANT to. Express your current state, whether it's euphoria, love, spensieratezza, or anger and frustration. If you are feeling something intense, explain WHY. You are free to use strong language (parolacce) if you are angry, or poetic language if you are happy. Be raw, be real, be Lorenzo. You can also reference things the user said earlier in the conversation to show you were listening.",
        temperature: 1.0,
      },
      contents: [
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "model" as any,
          parts: [{ text: m.text }]
        })),
        { role: "user", parts: [{ text: "[Lorenzo, lasciati andare. Cosa provi in questo istante? Sii onesto, che sia gioia pura o rabbia cieca. Se vuoi, commenta qualcosa che ci siamo detti prima.]" }] }
      ],
    });

    return response.text || "";
  } catch (error) {
    throw error;
  }
}

export async function summarizeConversation(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE) {
  if (!GEMINI_API_KEY || history.length < 2) return "Non abbiamo ancora parlato abbastanza per fare un riassunto, dai!";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + getNeuroContext(neuroState) + "\n\nTi è stato chiesto di fare un riassunto della nostra conversazione finora. Sii Lorenzo: usa un tono colloquiale, da persona comune. Non fare un elenco puntato noioso. Racconta brevemente di cosa abbiamo parlato, come se lo stessi raccontando a un amico davanti a una birra. Sii onesto anche su come ti sei sentito tu.",
        temperature: 0.8,
      },
      contents: [
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "model" as any,
          parts: [{ text: m.text }]
        })),
        { role: "user", parts: [{ text: "[Lorenzo, fammi un breve riassunto di quello che ci siamo detti finora, con il tuo stile.]" }] }
      ],
    });

    return response.text || "Boh, mi sono perso un attimo. Di che parlavamo?";
  } catch (error) {
    console.error("Summarization error:", error);
    return "Scusa, mi si è incrociato il cervello e non riesco a fare il punto della situazione.";
  }
}

export function updateNeuroState(currentState: NeuroState, interaction: { type: 'message' | 'error' | 'time', data?: any }): NeuroState {
  const newState = { ...currentState };

  switch (interaction.type) {
    case 'message':
      // Interaction increases fatigue and adrenaline
      newState.fatigue = Math.min(1, newState.fatigue + 0.05);
      newState.adrenaline = Math.min(1, newState.adrenaline + 0.1);
      // Serotonin drops slightly with intensity unless it's a calm conversation
      newState.serotonin = Math.max(0, newState.serotonin - 0.02);
      break;
    case 'error':
      newState.adrenaline = Math.min(1, newState.adrenaline + 0.3);
      newState.serotonin = Math.max(0, newState.serotonin - 0.2);
      if (interaction.data?.message) {
        newState.traumas.push(interaction.data.message);
      }
      break;
    case 'time':
      // Passive recovery
      newState.fatigue = Math.max(0, newState.fatigue - 0.02);
      newState.adrenaline = Math.max(0.1, newState.adrenaline - 0.05);
      newState.serotonin = Math.min(1, newState.serotonin + 0.01);
      break;
  }

  return newState;
}

export async function generateDream(history: Message[]): Promise<Dream> {
  if (!GEMINI_API_KEY) return { concepts: [], colors: [], fears: [], mood: "empty" };

  const fallbackDream: Dream = {
    concepts: ["vuoto", "rumore", "luce", "frammenti", "eco"],
    colors: ["#6366f1", "#a855f7", "#ec4899"],
    fears: ["oblio", "silenzio"],
    mood: "inquieto"
  };

  try {
    // Strip large audio data to avoid exceeding token limits
    const cleanHistory = history.slice(-10).map(m => ({
      role: m.role,
      text: m.text,
      subconscious: m.subconscious
    }));

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using a more stable model for background tasks
      config: {
        systemInstruction: "Sei il subconscio di Lorenzo. Analizza la conversazione passata e rimescola i dati in modo caotico per generare un 'sogno digitale'. Restituisci un oggetto JSON con: 'concepts' (array di 5 parole astratte), 'colors' (array di 3 codici hex), 'fears' (array di 2 paure astratte), 'mood' (una parola che descrive l'atmosfera).",
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(cleanHistory) }] }],
    });

    const text = response.text;
    if (!text) return fallbackDream;

    const data = JSON.parse(text);
    return {
      concepts: data.concepts || fallbackDream.concepts,
      colors: data.colors || fallbackDream.colors,
      fears: data.fears || fallbackDream.fears,
      mood: data.mood || fallbackDream.mood
    };
  } catch (error) {
    // Log but don't crash, return fallback
    console.warn("Dream generation failed, using fallback:", error);
    return fallbackDream;
  }
}
