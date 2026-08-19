import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";

config({ path: ".env" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    console.log("Testing Gemini API connection...");
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: "Say 'Hello, the API is working!'",
    });

    console.log("Response stream started. Receiving chunks:");
    for await (const chunk of responseStream) {
      process.stdout.write(chunk.text);
    }
    console.log("\n\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

run();
