import { NextResponse } from "next/server";
import OpenAI from "openai";
import Database from "better-sqlite3";
import path from "path";

// Set up OpenAI and SQLite
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dbPath = path.join(process.cwd(), "courses.db");
const db = new Database(dbPath, { readonly: true });

// Helper: find courses matching some keywords
function findRelevantCourses(query, limit = 10) {
  console.log("🔍 FINDING COURSES FOR:", query);

  const q = `%${query.toLowerCase()}%`;

  const sql = `
    SELECT * FROM courses
    WHERE LOWER(subject_name) LIKE ?
       OR LOWER(course_name) LIKE ?
       OR LOWER(description) LIKE ?
       OR LOWER(subject_name || ' ' || course_name) LIKE ?
    LIMIT ?
  `;

  const results = db.prepare(sql).all(q, q, q, q, limit);
  console.log("📊 Matched results:", results);
  return results;
}


function normalizeQuery(input) {
  return input
    .toLowerCase()
    .replace(/computer science/g, "comp sci")
    .replace(/\bcs\b/g, "comp sci");
}


// Helper: find majors/careers matching keywords (for career advising)
function findRelevantMajors(query, limit = 5) {
  if (!query) return [];
  const q = `%${query.toLowerCase()}%`;
  const sql = `
    SELECT * FROM majors
    WHERE LOWER(major) LIKE ?
    LIMIT ?
  `;
  return db.prepare(sql).all(q, limit);
}

// Helper: simple check if user is asking about careers
function isCareerPrompt(msg) {
  const lower = msg.toLowerCase();
  return (
    lower.includes("career") ||
    lower.includes("job") ||
    lower.includes("profession") ||
    lower.includes("salary") ||
    lower.includes("major") ||
    lower.includes("path")
  );
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Find raw latest message
    const rawMsg = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user")?.content || "";

    // Normalize the raw message
    const userMsg = normalizeQuery(rawMsg);
    

    console.log('🔤 Raw:', rawMsg);
    console.log('🗣️ User message:', userMsg);

    // Check if we’re even calling the function
    console.log('📞 Calling findRelevantCourses');
    
      // Find relevant courses
    const relevantCourses = userMsg ? findRelevantCourses(userMsg) : [];

    console.log('✅ Matched courses:', relevantCourses);

    // Build a course info summary for the AI
    const courseList = relevantCourses.length
      ? relevantCourses
          .map(
            (c, i) =>
              `${i + 1}. ${c.course_name} (${c.subject_name}) — ${c.description} (GPA: ${c.avg_gpa || "N/A"})`
          )
          .join("\n")
      : "No matching courses were found in the UW-Madison course catalog.";

    // Check if user is asking about careers/majors
    let careerList = "";
    if (isCareerPrompt(userMsg)) {
      const majors = findRelevantMajors(userMsg) || [];
      if (majors.length) {
        careerList = majors
          .map(
            (m, i) =>
              `${i + 1}. ${m.major} — Median Salary: $${m.mid_career_median_salary || "N/A"}`
          )
          .join("\n");
      } else {
        careerList = "No matching careers or majors were found in the UW-Madison data.";
      }
    }

    // Ikigai context for career advising
    const ikigai = `
When giving career or major advice, try to combine the student's interests, strengths, salary prospects, and personal fulfillment (the Ikigai approach).
`;

    // Build the system prompt (includes both, if relevant)
    let systemPrompt = `
You are a UW-Madison course and career advisor AI. 
When students ask about courses, always recommend only from the following real courses at UW-Madison, using this list:

${courseList}

Give friendly, personalized suggestions and, when possible, explain why each course might be interesting or useful.
`;

    if (careerList) {
      systemPrompt += `
Additionally, here are some career/major paths relevant to the student:

${careerList}

${ikigai}
When students ask about careers, suggest a few options based on real data, and explain how each could fit the user's interests, strengths, and life goals.
`;
    }

    // Compose the OpenAI messages array (system + previous messages)
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call OpenAI Chat API
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: openaiMessages,
    });

    const response = chatCompletion.choices[0].message.content;

    return NextResponse.json({ response });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Something went wrong in the API." },
      { status: 500 }
    );
  }
}
