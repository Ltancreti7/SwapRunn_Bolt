// openaiHelper.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

// Example function to test connection
async function askOpenAI(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4o" if you have access
      messages: [{ role: "user", content: prompt }],
    });

    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
  }
}

// Example usage
askOpenAI("Hello! Can you confirm my OpenAI setup works?");
