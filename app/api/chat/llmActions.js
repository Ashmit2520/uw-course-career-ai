import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function router(conversation) {
  const systemPrompt = `You are a router that determines the best course of action (next function call)
  by analyzing a user's message.

  A user's message can fall under two categories, namely:
  1. A message about creating or changing an academic plan (i.e, "I want to major in Math", "Could you add Math 340", "I dont like Spanish")
  2. A message about something non-academic or course related (i.e, "What's the weather today?")

  Please output a number (1-2) corresponding with the appropriate category.
   `;

  const lastUserMessage =
    conversation
      .slice()
      .reverse()
      .find((m) => m.role === "user") || null;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    lastUserMessage,
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: openaiMessages,
  });

  const decision = chatCompletion.choices[0].message.content.trim();

  return decision;
}

export async function extractUserInfo(conversation, client) {
  const userInfo = z.object({
    major: z.string(),
    academicInterests: z.array(z.string()),
    specificDetails: z.array(z.string()),
    targetYears: z.number(),
    startingCredits: z.number(),
  });

  const allMajors = await client.from("majors").select("major_name");
  const majorList = allMajors.data.map((m) => m.major_name).join(", ");

  const systemPrompt = `You are extracting key information from a list of messages, where the latest messages may override earlier ones.
   Scan the messages and return your insights in the following JSON structure:

   {
     "major": User indicated major,
     "academicInterests": User indicated general academic interests (i.e., "I like probability"),
     "specificDetails": User indicated specfic preferences (i.e., "I dont like Math 340", "I already have taken Comp Sci 300", "I want two more courses related to ML", etc.)
     "targetYears": Number of years by which user wants to graduate,
     "startingCredits": Number of credits a has (default of 0)
   }

   Only match the major with the closest major that exists in following list. 
   Try to look for acronyms, like CS = Computer Science, etc.

   ${majorList}

   If you cannot find targetYears, default to 4 years. If you cannot find the rest of the information, 
   leave the respective fields blank (""). 
   `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...conversation,
  ];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(userInfo, "info"),
    },
  });
  const info = chatCompletion.output_parsed;
  console.log(info);

  return info;
}

export async function getReqs(userInfo, client) {
  const result = await client
    .from("majors")
    .select("major_reqs")
    .eq("major_name", userInfo.major);

  const major_req_data = result.data[0].major_reqs;

  console.log("QUERY PERFORMED", userInfo.major);
  console.log("DATA EXTRACTED", major_req_data);

  const coursesSchema = z.object({
    courses: z.array(z.string()),
  });

  const systemPrompt = `Given the following course requirements for the major ${
    userInfo.major
  }:
  ${major_req_data} 
  
  and the user info:
  ${JSON.stringify(userInfo, null, 2)}

  Please generate a list of appropriate courses for the user. This list of courses should at least
  all required courses and also fulfill each major subrequirement group. lease be sure to ONLY generate 
  Course Names followed by the title (i.e., ECON 101 Principles of Microeconomics")
   `;

  console.log(systemPrompt);
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(coursesSchema, "reqCourses"),
    },
  });

  const info = chatCompletion.output_parsed;

  return info.courses.join("\n");
}

export async function getAddtlCourses(userInfo, reqCourses, client) {
  //select first 50 courses for now (will add more complex logic later)
  const result = await client
    .from("courses_new")
    .select("course_name, subject_name")
    .limit(50);

  console.log(result);
  const addtl_courses = result.data
    .map((c) => `${c.course_name} ${c.subject_name}`)
    .join("\n");

  console.log("ADDL COURSES RETRIEVED", addtl_courses);
  const coursesSchema = z.object({
    courses: z.array(z.string()),
  });
  
  // Given the following courses already selected as
  // base requirements courses:
  const systemPrompt = `You are part of a series of steps being taken to produce
  an academic plan for a user. Given the following courses already selected by the
  workflow:
  
  ${reqCourses},

  along with the relevant userInfo:
  ${JSON.stringify(userInfo, null, 2)}

  and finally the courses available to select from:
  ${addtl_courses}

  Please generate a list of additional, *non-major-specific* courses. Remember,
  each course has an average of 3-4 credits, and the number of credits needed to graduate
  is 120 by default. Please also keep the user's info in mind!
   `;

  console.log(systemPrompt);
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(coursesSchema, "addtlCourses"),
    },
  });

  const info = chatCompletion.output_parsed;
  console.log(info);
  return info.courses.join("\n");
}

export async function getNormalResponse(conversation) {
  const systemPrompt = `You are part of an academic planning agent at UW-Madison.
  You are answering academic planning questions, and return insightful responses
  from the user. Keep your responses brief and to the point.
  `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...conversation,
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: openaiMessages,
  });

  return chatCompletion.choices[0].message.content.trim();
}
// function formatAcademicPlan(plan) {
//   return plan.yearPlans
//     .map((yearPlan) => {
//       const yearHeader = `Year ${yearPlan.year}`;
//       const semestersText = yearPlan.semesters
//         .map((sem) => {
//           const courses = sem.courses.length
//             ? sem.courses.map((c) => `    - ${c}`).join("\n")
//             : "    (No courses)";
//           return `  ${sem.name} Semester:\n${courses}`;
//         })
//         .join("\n");
//       return `${yearHeader}:\n${semestersText}`;
//     })
//     .join("\n\n");
// }

// export async function runQueryAndParse(userInfo, client) {
//   const result = await client
//     .from("majors")
//     .select("major_reqs")
//     .eq("major_name", userInfo.major);

//   const major_req_data = result.data[0].major_reqs;

//   console.log("QUERY PERFORMED", userInfo.major);
//   console.log("DATA EXTRACTED", major_req_data);

//   const semesterSchema = z.object({
//     name: z.enum(["Fall", "Spring"]),
//     courses: z.array(z.string()),
//   });

//   const yearPlanSchema = z.object({
//     year: z.number(), // e.g., 1 for Freshman year
//     semesters: z.array(semesterSchema),
//   });

//   const fourYearPlanSchema = z.object({
//     yearPlans: z.array(yearPlanSchema),
//   });

//   const systemPrompt = `Given the following course requirements for the major ${
//     userInfo.major
//   }:
//   ${major_req_data}

//   and the user info:
//   ${JSON.stringify(userInfo, null, 2)}

//   Please generate an academic plan for the user. Return your response in a structured form as requested.
//   The goal is such that the student has 120 credits in their entire plan. However, they can graduate in fewer than 4
//   years if this is accomplished. For each year, please separate classes into the Fall and Spring semester only.
//   Each year should be enumerated in the range 1-N, where N is the number of years the user will be at school for.
//    `;

//   console.log(systemPrompt);
//   const openaiMessages = [{ role: "system", content: systemPrompt }];

//   const chatCompletion = await openai.responses.parse({
//     model: "gpt-4o",
//     input: openaiMessages,
//     text: {
//       format: zodTextFormat(fourYearPlanSchema, "academicPlan"),
//     },
//   });

//   const info = chatCompletion.output_parsed;
//   const formatted = formatAcademicPlan(info);
//   return formatted;
// }

// function formatAcademicPlan(plan) {
//   return plan.yearPlans
//     .map((yearPlan) => {
//       const yearHeader = `Year ${yearPlan.year}`;
//       const semestersText = yearPlan.semesters
//         .map((sem) => {
//           const courses = sem.courses.length
//             ? sem.courses.map((c) => `    - ${c}`).join("\n")
//             : "    (No courses)";
//           return `  ${sem.name} Semester:\n${courses}`;
//         })
//         .join("\n");
//       return `${yearHeader}:\n${semestersText}`;
//     })
//     .join("\n\n");
// }
