const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'apikey' });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Hello'
    });
    console.log(response.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
