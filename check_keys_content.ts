import dotenv from 'dotenv';
dotenv.config();

const k1 = process.env.GEMINI_API_KEY || "";
const k2 = process.env.MINHA_CHAVE_PAGA || "";

console.log("GEMINI_API_KEY:", k1.substring(0, 5) + "...");
console.log("MINHA_CHAVE_PAGA:", k2.substring(0, 5) + "...");
