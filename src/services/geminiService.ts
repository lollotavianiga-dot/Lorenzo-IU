// Client-side geminiService.ts
// Key logic is now handled server-side


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

// Update geminiService.ts to use server-side API endpoints
export async function* sendMessageStream(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE, userId: string = "default") {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        history, 
        neuroState, 
        systemInstruction: SYSTEM_INSTRUCTION + getNeuroContext(neuroState) 
      })
    });

    if (!response.ok) throw new Error("Server responded with " + response.status);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        yield { text: fullText, subconscious: undefined };
      }
    }

    // After text is complete, get TTS from server half the time
    if (Math.random() > 0.5 && fullText) {
      const voice = getVoiceForUser(userId);
      let tone = "natural and conversational";
      if (neuroState.adrenaline > 0.7) tone = "fast, excited and slightly breathless";
      if (neuroState.fatigue > 0.6) tone = "tired, slow and a bit grumpy";
      if (neuroState.serotonin > 0.7) tone = "calm, warm and peaceful";

      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, voice, tone })
      });

      if (ttsResponse.ok) {
        const { audio } = await ttsResponse.json();
        if (audio) {
          yield { text: fullText, audio, subconscious: undefined };
        }
      }
    }
  } catch (error) {
    console.error("Gemini Service Error:", error);
    yield { text: "Scusami, ho avuto un blackout mentale. Possiamo riprovare?", subconscious: undefined };
  }
}

export async function generateSpontaneousThought(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE) {
  try {
    const response = await fetch("/api/thought", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, neuroContext: getNeuroContext(neuroState) })
    });
    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Thought fetch error:", error);
    return "";
  }
}

export async function summarizeConversation(history: Message[], neuroState: NeuroState = DEFAULT_NEURO_STATE) {
  if (history.length < 2) return "Non abbiamo ancora parlato abbastanza per fare un riassunto, dai!";
  try {
    const response = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, neuroContext: getNeuroContext(neuroState) })
    });
    const data = await response.json();
    return data.text || "Boh, mi sono perso un attimo.";
  } catch (error) {
    console.error("Summary fetch error:", error);
    return "Scusa, mi si è incrociato il cervello.";
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
  const fallbackDream: Dream = {
    concepts: ["vuoto", "rumore", "luce", "frammenti", "eco"],
    colors: ["#6366f1", "#a855f7", "#ec4899"],
    fears: ["oblio", "silenzio"],
    mood: "inquieto"
  };

  try {
    const response = await fetch("/api/dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history })
    });
    if (!response.ok) return fallbackDream;
    return await response.json();
  } catch (error) {
    console.warn("Dream generation failed, using fallback:", error);
    return fallbackDream;
  }
}
