import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createClient } from "@/app/api/supabase/server";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const { messages } = await req.json();
  const supabase = await createClient();

  const userInfo = await extractQueryInfo(messages);
  console.log(userInfo);

  const selected_major = await fetchMajor(userInfo, supabase);
  console.log(selected_major);

  const parsedFromQuery = await runQueryAndParse(
    selected_major,
    userInfo,
    supabase
  );
  console.log(parsedFromQuery);

  const textFormattedPlan = formatAcademicPlan(parsedFromQuery);
  console.log(textFormattedPlan);

  return NextResponse.json({ text: textFormattedPlan });
}

function formatAcademicPlan(plan) {
  return plan.yearPlans
    .map((yearPlan) => {
      const yearHeader = `Year ${yearPlan.year}`;
      const semestersText = yearPlan.semesters
        .map((sem) => {
          const courses = sem.courses.length
            ? sem.courses.map((c) => `    - ${c}`).join("\n")
            : "    (No courses)";
          return `  ${sem.name} Semester:\n${courses}`;
        })
        .join("\n");
      return `${yearHeader}:\n${semestersText}`;
    })
    .join("\n\n");
}

async function extractQueryInfo(conversation) {
  const queryData = z.object({
    major: z.string(),
    interests: z.array(z.string()),
    targetYears: z.number(),
    startingCredits: z.number(),
  });

  const systemPrompt = `You are extracting key information from a list of messages, where the latest messages may override earlier ones.
   Scan the messages and return your insights in the following JSON structure:

   {
     "major": User indicated major,
     "interest": User indicated academic/course interests,
     "targetYears": Number of years by which user wants to graduate,
     "startingCredits": Number of credits a has (default of 0)
   }

   If you cannot find targetYears, default to 4 years. If you cannot find the rest of the  information, 
   leave the respective fields blank ("").  If a field is mentioned multiple times, assume the most 
   recent value overrides previous ones.
   `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...conversation,
  ];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(queryData, "query"),
    },
  });
  const info = chatCompletion.output_parsed;

  return info;
}

// feedback loop for all of queryData to be non-null until user has filled aove
async function fetchMajor(data, client) {
  const userData = data;

  const allMajors = await client.from("majors").select("major_name");
  const majorList = allMajors.data.map((m) => m.major_name).join(", ");

  const systemPrompt = `You are an assistant that generates the closest or most appropriate major for a user.
  Given the user data below, provide a major that matches best:

  {
     "major": User indicated major,
     "interest": User indicated academic/course interests,
     "targetYears": Number of years by which user wants to graduate,
     "startingCredits": Number of credits a has (default of 0)
  }
  Only match with the closest major that exists in following list. Try to look for acronyms, like CS = Computer Science, etc.

  ${majorList}

  If no majors match, return "No majors match with ___ (the user's major)".
  If any fields are blank "" or empty (null), return the following "No data to generate major from".
  `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userData, null, 2) },
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: openaiMessages, //messages:
  });

  return chatCompletion.choices[0].message.content;
}

async function runQueryAndParse(selected_major, userInfo, client) {
  const result = await client
    .from("majors")
    .select("major_reqs")
    .eq("major_name", selected_major);

  const major_req_data = result.data[0].major_reqs;

  console.log("QUERY PERFORMED", selected_major);
  console.log("DATA EXTRACTED", major_req_data);

  const semesterSchema = z.object({
    name: z.enum(["Fall", "Spring"]),
    courses: z.array(z.string()),
  });

  const yearPlanSchema = z.object({
    year: z.number(), // e.g., 1 for Freshman year
    semesters: z.array(semesterSchema),
  });

  const fourYearPlanSchema = z.object({
    yearPlans: z.array(yearPlanSchema),
  });

  const systemPrompt = `Given the following course requirements for the major ${selected_major}:
  ${major_req_data} 
  
  and the user info:
  ${JSON.stringify(userInfo, null, 2)}

  Please generate an academic plan for the user. Return your response in a structured form as requested.
  The goal is such that the student has 120 credits in their entire plan. However, they can graduate in fewer than 4
  years if this is accomplished. For each year, please separate classes into the Fall and Spring semester only. 
  Each year should be enumerated in the range 1-N, where N is the number of years the user will be at school for.
   `;

  console.log(systemPrompt);
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(fourYearPlanSchema, "academicPlan"),
    },
  });

  const info = chatCompletion.output_parsed;
  return info;
}
