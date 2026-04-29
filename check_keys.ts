import dotenv from 'dotenv';
dotenv.config();

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Found" : "Not Found");
console.log("MINHA_CHAVE_PAGA:", process.env.MINHA_CHAVE_PAGA ? "Found" : "Not Found");
console.log("API_KEY:", process.env.API_KEY ? "Found" : "Not Found");
