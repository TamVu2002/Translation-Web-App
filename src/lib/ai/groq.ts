import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Groq supported models
export const GROQ_MODELS = {
  // Whisper for transcription (free!)
  WHISPER_LARGE_V3: 'whisper-large-v3',
  WHISPER_LARGE_V3_TURBO: 'whisper-large-v3-turbo',
  
  // LLM for translation
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  GEMMA_2_9B: 'gemma2-9b-it',
} as const;

// Default models to use
export const DEFAULT_TRANSCRIPTION_MODEL = GROQ_MODELS.WHISPER_LARGE_V3_TURBO;
export const DEFAULT_TRANSLATION_MODEL = GROQ_MODELS.LLAMA_3_3_70B;
