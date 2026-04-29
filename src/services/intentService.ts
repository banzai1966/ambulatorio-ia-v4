import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
};

export async function analyzeIntent(message: string, history: any[] = []) {
  try {
    // Tenta primeiro via API do backend
    const response = await axios.post('/api/analyze-intent', { message, history });
    return response.data;
  } catch (error: any) {
    console.warn("[IA] Falha no backend, tentando processamento local (Frontend)...");
    
    const key = getGeminiKey();
    if (!key) {
      console.error("[IA] Erro ao analisar intenção: API Key não configurada.");
      return { error: "API_KEY_MISSING" };
    }

    try {
      const genAI = new GoogleGenerativeAI(key);
      
      const systemInstruction = `Você é o "Assistente Digital de Suporte" do Ambulatório IA.
      Seu objetivo é auxiliar a equipe médica e de recepção, analisando solicitações de pacientes e organizando informações.
      REGRAS ABSOLUTAS: 1. Você NÃO responde diretamente ao paciente. 2. Analise a intenção. 3. Sugestões curtas e profissionais.`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction
      });

      const contents = history.length > 0 ? history : [{ role: 'user', parts: [{ text: message }] }];
      const result = await model.generateContent({ contents });
      const response = result.response;
      
      return {
        text: response.text() || "",
        functionCalls: [], // No frontend, simplificamos sem tools por enquanto
      };
    } catch (localError: any) {
      console.error("[IA] Erro no processamento local:", localError);
      return { error: localError.message || "API_ERROR" };
    }
  }
}
