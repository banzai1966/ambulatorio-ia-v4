import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const key = process.env.MINHA_CHAVE_PAGA || process.env.GEMINI_API_KEY;
  if (!key) return console.log("No key");
  
  const genAI = new GoogleGenerativeAI(key);
  try {
    // The SDK doesn't have a direct listModels, we have to use the REST API or just guess
    console.log("Testing gemini-1.5-flash with v1...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hi");
    console.log("Success with gemini-1.5-flash v1");
  } catch (e: any) {
    console.log("Failed with gemini-1.5-flash:", e.message);
    
    try {
      console.log("Testing gemini-pro...");
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("Hi");
      console.log("Success with gemini-pro");
    } catch (e2: any) {
      console.log("Failed with gemini-pro:", e2.message);
    }
  }
}

listModels();
