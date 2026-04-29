import axios from 'axios';

async function test() {
  try {
    const response = await axios.post('http://localhost:3000/api/process-clinical', {
      input: "Teste",
      examMode: "standard",
      reason: "Teste"
    });
    console.log("Response:", response.data);
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

test();
