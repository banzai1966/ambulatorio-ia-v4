import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.MINHA_CHAVE_PAGA || process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}

listModels();
