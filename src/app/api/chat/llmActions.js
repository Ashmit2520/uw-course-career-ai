import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { OpenAI } from "openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

import { getLastExchange } from "@/utils/llmUtils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function router(conversation) {
  const lastExchange = getLastExchange(conversation);
  // const lastUserMessage =
  //   conversation
  //     .slice()
  //     .reverse()
  //     .find((m) => m.role === "user") || null;

  console.log(lastExchange);
  const systemPrompt = `You are a router that determines whether the user wants to engage in academic planning.

    You will see a pair of messages: the assistant's last message and the user's reply.

    Return:
    1 — if the user is discussing or agreeing to create or change an academic plan,
    (e.g., "I want to major in Computer Science, could you make a 3-year plan for me?", 
    "I want to major in Stats", "I want a 4-year plan for a DS major", 
    "Yes" after being asked about a major, "I like CS", "Could you Math 340 to my 4-year plan")
    2 — if the user is asking about more information regarding classes, not plans, (e.g., "Could you
    suggest some Machine Learning courses for an introductory student?", "What are some classes like 
    Math 340?", "Give me 10 classes on Spanish", "Give me DS courses")
    3 — if the user is talking about unrelated topics not above (e.g., jokes, greetings, questions not about academics, 
    "Hey, how's it going", "Hi!", "What's the weather like?")

    Only return "1", "2", or "3".`;
  // const systemPrompt = `You are a router that determines the best course of action (next function call)
  // by analyzing a user's message as follows:

  // ${lastUserMessage}

  // A user's message can fall under two categories, namely:
  // 1. A message about creating or changing an academic plan (i.e, "I want to major in Math", "Could you add Math 340", "I dont like Spanish")
  // 2. A message about something non-academic or course related (i.e, "What's the weather today?")

  // Please output a number (1-2) corresponding with the appropriate category.
  //  `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...lastExchange,
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: openaiMessages,
    temperature: 0,
  });

  const result = chatCompletion.choices[0].message.content.trim();
  const decision =
    result === "1" || result === "2" || result === "3" ? result : "3"; // fallback to 2

  return decision;
}

export async function extractUserInfo(conversation, client) {
  const userInfo = z.object({
    major: z.string(),
    academicInterests: z.array(z.string()),
    specificDetails: z.array(z.string()),
    targetYears: z.number(),
    startingCredits: z.number(),
    isUndergrad: z.boolean(),
  });

  const allMajors = await client.from("majors").select("major_name");
  const majorList = allMajors.data.map((m) => m.major_name).join(", ");

  const systemPrompt = `You are extracting key information from a list of messages, where the latest messages may override earlier ones.
   Scan the messages and return your insights in the following JSON structure:

   {
     "major": User indicated major,
     "academicInterests": User indicated general academic interests (i.e., "probability", "art", "Spanish literature", "geometry", "pianos"),
     "specificDetails": User indicated specfic preferences (i.e., "I dont like Math 340", "I already have taken Comp Sci 300", "I want two more courses related to ML", etc.)
     "targetYears": Number of years by which user wants to graduate,
     "startingCredits": Number of credits a has (default of 0)
     "isUndergrad": True if user is an undergraduate, False otherwise. This defaults to True if a user hasn't explicity said anything 

   }

   Only match the major field with the closest major that exists in following list. Scan the user's messages and please categorize
   the user's academicInterests into discrete categories. For example, if they say, "I like learning about data science and math", this should
   be converted to "data science", "math". Make sure to cover each category, separately, even if they are semantically similar. For example,
   "I like Romance languages, like Spanish and Italian" should map to three places: "Romance languages", "Spanish", and "Italian".

   Try to look for acronyms, like CS = Computer Science, etc.

   ${majorList}

   Additionally, only match the course_code field 
   

   If you cannot find targetYears, default to 4 years. If you cannot find the rest of the information, 
   leave the respective fields blank (""), except for isUndergrad, which defaults to True.
   `;

  const userOnlyMessages = conversation.filter((m) => m.role === "user");

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...userOnlyMessages,
  ];
  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(userInfo, "info"),
    },
  });

  const info = chatCompletion.output_parsed;

  const major = info.major?.toUpperCase();
  const course_data = await client
    .from("majors")
    .select("course_code")
    .eq("major_name", major)
    .single(); // optional: assumes only one match

  console.log("COURSE DATA", course_data);
  const course_code = course_data?.data?.course_code ?? null;

  const userInfoWithCode = {
    ...info,
    course_code,
  };
  console.log(userInfoWithCode);

  return userInfoWithCode;
}

export async function getReqs(userInfo, conversation, client) {
  const result = await client
    .from("majors")
    .select("major_reqs")
    .eq("major_name", userInfo.major);

  const major_req_data = result.data[0].major_reqs;

  const lastExchange = getLastExchange(conversation);

  console.log("QUERY PERFORMED", userInfo.major);
  console.log("DATA EXTRACTED", major_req_data);

  const coursesSchema = z.object({
    courses: z.array(z.string()),
  });

  const systemPrompt = `Given the following course requirements for the major ${userInfo.major}:
  ${major_req_data} 
  
  and the user info's specific details (only take this into account if they say something like
  "I don't like Math 240" or "I want Stat 500+ courses"):
  ${userInfo.specificDetails}

  Please generate a list of appropriate courses for the user. This list of courses should fulfill, at 
  the very least, the required courses and also fulfill each major subrequirement group. lease be sure to 
  ONLY generate Course Names followed by the title (i.e., ECON 101 PRINCIPLES OF MICROECONOMICS"). ALL COURSES 
  SHOULD BE IN CAPITAL LETTERS (CAPS LOCK).
   `;

  // console.log(systemPrompt);
  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...lastExchange,
  ];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o-mini",
    input: openaiMessages,
    text: {
      format: zodTextFormat(coursesSchema, "reqCourses"),
    },
  });

  const info = chatCompletion.output_parsed;

  return info.courses.join("\n");
}

export async function getAddtlCourses(userInfo, client) {
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
  });
  const vectorstore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: client,
    tableName: "courses_new",
    queryName: "match_courses_new", // your custom SQL function
  });

  const interests = userInfo.academicInterests;
  const allResults = [];

  let fullFilter = {};
  let noCourseNameFilter = {};

  if (userInfo.course_code) {
    fullFilter.course_name = userInfo.course_code;
  }
  if (userInfo.isUndergrad === true) {
    fullFilter.needs_grad_standing = false;
    noCourseNameFilter.needs_grad_standing = false;
  }

  console.log("Full filter:", fullFilter);
  console.log("No course_name filter:", noCourseNameFilter);

  for (const interest of interests) {
    const results_major_specific = await vectorstore.similaritySearch(
      interest,
      5,
      fullFilter
    );

    const results_non_major_specific = await vectorstore.similaritySearch(
      interest,
      3,
      noCourseNameFilter
    );

    allResults.push(...results_major_specific);
    allResults.push(...results_non_major_specific);
  }

  const seen = new Set();
  const uniqueCourses = [];

  for (const r of allResults) {
    const meta = r.metadata;
    const courseStr = `${meta.course_name}${
      meta.subject_name ? ` ${meta.subject_name}` : ""
    }`;

    if (!seen.has(courseStr)) {
      seen.add(courseStr);
      uniqueCourses.push(courseStr);
    }
  }

  const coursesSchema = z.object({
    courses: z.array(z.string()),
  });

  const parsed = coursesSchema.parse({ courses: uniqueCourses });

  return parsed.courses.join("\n");
  // const coursesSchema = z.object({
  //   courses: z.array(z.string()),
  // });
  // const info = chatCompletion.output_parsed;
  // console.log(info);
  // return info.courses.join("\n");

  //select first 50 courses for now (will add more complex logic later)
  // const result = await client
  //   .from("courses_new")
  //   .select("course_name, subject_name")
  //   .limit(50);

  // console.log(result);
  // const addtl_courses = result.data
  //   .map((c) => `${c.course_name} ${c.subject_name}`)
  //   .join("\n");

  // // Given the following courses already selected as
  // // base requirements courses:
  // const systemPrompt = `You are part of a series of steps being taken to produce
  // an academic plan for a user. Given the following courses already selected by the
  // workflow:

  // ${reqCourses},

  // along with the relevant userInfo:
  // ${JSON.stringify(userInfo, null, 2)}

  // and finally the courses available to select from:
  // ${addtl_courses}

  // Please generate a list of additional, *non-major-specific* courses. Remember,
  // each course has an average of 3-4 credits, and the number of credits needed to graduate
  // is 120 by default. Please also keep the user's info in mind!
  //  `;

  // console.log(systemPrompt);
  // const openaiMessages = [{ role: "system", content: systemPrompt }];

  // const chatCompletion = await openai.responses.parse({
  //   model: "gpt-4.1-mini",
  //   input: openaiMessages,
  //   text: {
  //     format: zodTextFormat(coursesSchema, "addtlCourses"),
  //   },
  // });
}

export async function combineReqsAndAddtl(userInfo, reqCourses, addtlCourses) {
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

  const systemPrompt = `You are part of a step in an academic planning agent that creates a course plan
  for a user at UW-Madison. Your job is to combine a list of required courses and a list of additional
  courses into a four year plan structure. This structure should not contain any duplicates, and should be ordered
  chronologically, in semesters and years.
  
  In general, please order classes logically. For instance, COMP SCI 300 should come before COMP SCI 400 because 
  400 > 300. In general, higher number classes tend to come later in the plan, and lower number courses tend to come 
  earlier in the plan.

  The required courses are here:
  ${reqCourses}

  And the additional courses are here:
  ${addtlCourses}

  Please also consider the userInfo:
  ${JSON.stringify(userInfo, null, 2)}

  In general, each course has 3-4 credits. Please keep in mind that in order to graduate, the user's credits should
  ultimately be at least 120. The goal is such that the student has 120 credits in their entire plan. However, they can 
  graduate in fewer than 4 years if this is accomplished. For each year, please separate classes into the Fall and Spring semester only.
  Each year should be enumerated in the range 1-N, where N is the number of years the user will be at school for. In general,
  each semester should contain 12-18 credits( 3-5 classes)

  Course Names should be followed by the title (i.e., ECON 101 PRINCIPLES OF MICROECONOMICS"). ALL COURSES 
  SHOULD BE IN CAPITAL LETTERS (CAPS LOCK).

  Also, **only use courses mentioned in the addiitonal courses or required courses**. 
  Give priority to the req courses, and then fill the schedule with the additional courses up until the limit.

  Ensure that the number of courses * 4 is at least 120.
  `;

  console.log(systemPrompt);
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4.1-nano",
    input: openaiMessages,
    text: {
      format: zodTextFormat(fourYearPlanSchema, "academicPlan"),
    },
  });

  const info = chatCompletion.output_parsed;
  const formatted = formatAcademicPlan(info);
  return formatted;
}

export async function getNormalResponse(conversation) {
  try {
    const systemPrompt = `You are part of an academic planning agent at UW-Madison.
  You are answering academic planning questions, and return insightful responses
  from the user. Keep your responses brief and to the point. Do not generate a plan, ever.
  Instead, direct the user towards a plan by asking questions about creating a plan. 
  Never, give an academic answer. Never mention course names, schools, or any other specific
  things because you are not an expert.

  Remember, the goal for the user is to generate a creative academic plan for a major.
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
  } catch (err) {
    console.error("❌ Error in getNormalResponse:", err); // 👈 Print real error
    return "Sorry, something went wrong."; // Fallback
  }
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

export async function checkPrereqs(userInfo, plan) {}

export async function searchCourses(userInfo, client, conversation) {
  const lastUserMessage =
    conversation
      .slice()
      .reverse()
      .find((m) => m.role === "user") || null;

  const reformulationPrompt = `
    You are an assistant helping with academic planning. Reformulate the user's message into a 
    complete standalone query that can be used to search a courses database with RAG. 
    Include any course codes or context from the prior conversation.

    User's last message:
    "${lastUserMessage?.content}"

    **DO NOT ANSWER** the user's query. Instead, extract the user's query information about
    a course so that it can search a vector database of class names, class descriptions, and 
    class subject names. For example, if the conversation was:

    assistant: "How can I help you today"
    user: "Tell me about Deep Learning courses here at UW-Madison"

    You would reformulate the user's query to:
    "Deep learning"

    Additionally:
    assistant: "Sure! Do you want to learn more about language courses offered here?"
    user: "Yes, in particular, which clay sculpting courses do you have here?"

    You would reformulate the user's query to:
    "Clay sculpting"

    One more example:
    assistant: "Do you want to explore Computer Science courses, such as COMPSCI 540 and 532?"
    user: "Sure, tell me about CS 540 and CS 300."

    You would reformulate the user's query to:
    "COMPSCI 540, COMPSCI 300"

    CS, compsci, etc. should be rephrased to COMPSCI, since this is the way COMPSCI courses
    are stored in the database.
    `;

  console.log(reformulationPrompt);

  const reformulationMessages = [
    { role: "user", content: reformulationPrompt },
    ...conversation,
  ];

  const reformulationCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: reformulationMessages,
  });

  const rewrittenQuery =
    reformulationCompletion.choices[0].message.content.trim();
  console.log(rewrittenQuery);

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: rewrittenQuery,
  });

  const embedding = embeddingResponse.data[0].embedding;

  const filter = { needs_grad_standing: !userInfo.isUndergrad };
  const count = 10;

  const similarity_output = await client.rpc("match_courses_new", {
    query_embedding: embedding,
    match_count: count,
    filter: filter,
  });
  const kwd_output = await client.rpc("kw_match_courses_new", {
    query_text: rewrittenQuery,
    match_count: count,
    filter: filter,
  });

  console.log("KWD", kwd_output, similarity_output);
  const courses = [];
  const courseDescriptions = [];

  for (const r of similarity_output.data) {
    const meta = r.metadata;
    const courseStr = `${meta.course_name}${
      meta.subject_name ? ` ${meta.subject_name}` : ""
    }`;
    const courseDescrAndName = `${courseStr}: ${meta.description}`;
    console.log("COURSE DESCR AND NAME", courseDescrAndName);
    courses.push(courseStr);
    courseDescriptions.push(courseDescrAndName);
  }

  for (const r of kwd_output.data) {
    const meta = r.metadata;
    const courseStr = `${meta.course_name}${
      meta.subject_name ? ` ${meta.subject_name}` : ""
    }`;
    const courseDescrAndName = `${courseStr}: ${meta.description}`;
    console.log("COURSE DESCR AND NAME", courseDescrAndName);
    courses.push(courseStr);
    courseDescriptions.push(courseDescrAndName);
  }
  const coursesSchema = z.object({
    courses: z.array(z.string()),
  });

  const parsedCourses = coursesSchema
    .parse({ courses: courses })
    .courses.join("\n");
  const parsedDescriptions = courseDescriptions.join("\n");

  const systemPrompt = `You are part of an academic planning agent workflow at UW-Madison. A RAG
   vector search has been done to retrieve relevant courses to a user's query. Please
   integrate this information about the courses and their specific names:

   ${parsedCourses}

   Along with the corresponding course descriptions:

   ${parsedDescriptions}
   to formulate a response to the user. Please keep your response to the point, and remember,
   your job is NOT to create a plan for the user. For context, here is the user's info 
   ${JSON.stringify(
     userInfo,
     null,
     2
   )}. Please also make sure you copy the course name EXACTLY
   as it appears in the context, regardless of how the user defines it.
   
   Remember, your job is to just return a response. You are not an expert! You are from 
   UW-Madison. Do not give recommendations or suggestions, and do not refer the user 
   to any information you do not know. Do not create an academic plan. Ask questions to
   the user that will lead the user to create a plan or query for more courses.
  `;

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    lastUserMessage,
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: openaiMessages,
  });

  let finalOutput = chatCompletion.choices[0].message.content.trim();

  for (const r of similarity_output.data) {
    const meta = r.metadata;

    const courseStr = `${meta.course_name}${
      meta.subject_name ? ` ${meta.subject_name}` : ""
    }`;

    const course_id = r.id;
    const regex = new RegExp(`\\b${courseStr}\\b`, "g");
    finalOutput = finalOutput.replace(
      regex,
      `[${courseStr}](http://localhost:3000/courses/${course_id})`
    );
  }

  return finalOutput;
}

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
