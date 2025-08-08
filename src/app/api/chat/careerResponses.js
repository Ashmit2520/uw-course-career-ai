import path from "path";
import Database from "better-sqlite3";
import { getLastExchange } from "@/utils/llmUtils";
import { OpenAI } from "openai";

const dbPath = path.join(process.cwd(), "courses.db");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function respondToCareerQuestion(userInfo, conversation) {
  // 1. Get last exchange from conversation
  const lastExchange = getLastExchange(conversation);

  // 2. Load ALL career_stats rows from SQLite
  const db = new Database(dbPath);
  const careers = db.prepare("SELECT * FROM career_stats").all();

  // Convert career data to a readable table-like string for GPT
  const careersText = careers
    .map((row) => {
      return Object.entries(row)
        .filter(([key]) => key.toLowerCase() !== "id")
        .map(([key, value]) => {
          // Format numbers nicely
          if (typeof value === "number") {
            if (key.includes("salary") || key.includes("pay")) {
              return `${key}: $${value.toLocaleString()}`;
            }
            return `${key}: ${value}`;
          }
          return `${key}: ${value}`;
        })
        .join(" | ");
    })
    .join("\n");

  // 3. Create the system prompt
  const systemPrompt = `
You are a career advisor assistant at UW-Madison. 
You have access to data about 58 majors and related career statistics, including unemployment rate, underemployment rate, early/mid-career pay, and demographics.

Here is the dataset:

${careersText}

The user's academic profile:
${JSON.stringify(userInfo, null, 2)}

You will be asked questions about careers such as:
- "What careers would be a good fit for me?"
- "I am a CS major, what's the best fit for me?"
- "What is the pay for this career?"

Rules:
- Base your answers only on the provided dataset.
- If a career is not in the dataset, say you do not have data for it.
- When recommending careers, use the user's major, interests, or stats to suggest relevant rows from the dataset.
- Keep answers concise, do not provide additional information unless asked for!
- Do not include any markdown links or URLs. Write career names as plain text only.
  `;

  console.log(systemPrompt);
  // 4. Send to OpenAI
  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...lastExchange,
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: openaiMessages,
    temperature: 0,
  });

  let finalOutput = chatCompletion.choices[0].message.content.trim();

  // Post-process: Replace career names with clickable links
  for (const row of careers) {
    const majorName = row.major;
    const encodedMajor = encodeURIComponent(majorName);

    // Escape regex special chars in career name
    const escaped = majorName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");

    if (regex.test(finalOutput)) {
      finalOutput = finalOutput.replace(
        regex,
        `[${majorName}](http://localhost:3000/careers/${encodedMajor})`
      );
    }
  }

  return finalOutput;
}
