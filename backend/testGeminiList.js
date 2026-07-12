const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6K4ZSQweDrcGS-Edqjv6YEnhNOsvHruTPphqEqT3T0xpw' });

async function run() {
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      console.log(model.name);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
