import { zodTextFormat } from "openai/helpers/zod";
import { OpenAI } from "openai";
import {
  userInfo,
  coursesSchema,
  fourYearPlanSchema,
} from "@/utils/llmSchemas";
import {
  getLastExchange,
  formatAcademicPlan,
  kwd_similarity_search,
  vector_similarity_search,
} from "@/utils/llmUtils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function router(conversation) {
  const lastExchange = getLastExchange(conversation);

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
  const decision = ["1", "2", "3"].includes(result) ? result : "3";

  return decision;
}

export async function extractUserInfo(conversation, supabaseClient) {
  const allMajors = await supabaseClient.from("majors").select("major_name");
  const majorList = allMajors.data.map((m) => m.major_name).join(", ");

  const systemPrompt = `You are extracting key information from a list of messages, where the latest messages may override earlier ones.
   Scan the messages and return your insights in the following JSON structure:

   {
     "major": User indicated major,
     "academicInterests": User indicated general academic interests (i.e., "probability", "art", "Spanish literature", "geometry", "pianos"),
     "specificDetails": User indicated specfic preferences (i.e., "I dont like Math 340", "I already have taken Comp Sci 300", "I want two more courses related to ML", etc.)
     "targetYears": Number of years by which user wants to graduate,
     "credits": Number of credits a has (default of 0)
     "isUndergrad": True if user is an undergraduate, False otherwise. This defaults to True if a user hasn't explicity said anything 

   }

   Only match the major field with the closest major that exists in following list. Scan the user's messages and please categorize
   the user's academicInterests into discrete categories. For example, if they say, "I like learning about data science and math", this should
   be converted to "data science", "math". Make sure to cover each category, separately, even if they are semantically similar. For example,
   "I like Romance languages, like Spanish and Italian" should map to three places: "Romance languages", "Spanish", and "Italian".

   Try to look for acronyms, like CS = Computer Science, and only match majors in this list:

   ${majorList}

   If you cannot find targetYears, default to 4 years. If you cannot find the rest of the information, 
   leave the respective fields blank (""), except for isUndergrad, which defaults to True.
   `;

  console.log(systemPrompt);
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
  const course_data = await supabaseClient
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

export async function getReqs(userInfo, supabaseClient) {
  const result = await supabaseClient
    .from("majors")
    .select("major_reqs")
    .eq("major_name", userInfo.major);

  const major_req_data = result.data[0].major_reqs;

  console.log("QUERY PERFORMED", userInfo.major);
  console.log("DATA EXTRACTED", major_req_data);

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

  //placeholder until we can retrieve courses by specific L&S breadth
  // (i.e., literature, social science, biological science)
  const breadth_courses = [
    "ENGL 140 COMM B TOPICS IN ENGLISH LITERATURE",
    "ASIAN AM, ​ENGL 150 LITERATURE & CULTURE OF ASIAN AMERICA",
    "ECON 101 PRINCIPLES OF MICROECONOMICS",
    "PHILOS 101 INTRODUCTION TO PHILOSOPHY",
    "SOC 134 SOCIOLOGY OF RACE & ETHNICITY IN THE UNITED STATES",
    "CURRIC 277 VIDEOGAMES & LEARNING",
    "ANTHRO 105 PRINCIPLES OF BIOLOGICAL ANTHROPOLOGY",
    "BIOCHEM 104 MOLECULES TO LIFE AND THE NATURE OF SCIENCE",
    "PHYSICS 103 GENERAL PHYSICS",
    "CHEM 103 GENERAL CHEMISTRY I",
  ];

  console.log(systemPrompt);
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o-mini",
    input: openaiMessages,
    text: {
      format: zodTextFormat(coursesSchema, "reqCourses"),
    },
  });

  const req_courses = [
    ...breadth_courses,
    ...chatCompletion.output_parsed.courses,
  ];

  return req_courses;
  // return info.courses.join("\n");
}

export async function getAddtlCourses(userInfo, supabaseClient) {
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
    const results_major_specific = await vector_similarity_search(
      openai,
      supabaseClient,
      interest,
      10,
      fullFilter
    );

    const results_non_major_specific = await vector_similarity_search(
      openai,
      supabaseClient,
      interest,
      10,
      noCourseNameFilter
    );

    allResults.push(...results_major_specific.data);
    allResults.push(...results_non_major_specific.data);
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

  const addtl_courses = coursesSchema.parse({ courses: uniqueCourses }).courses;

  console.log("ADDTL Courses", addtl_courses);
  // return parsed.courses.join("\n");
  return addtl_courses;
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
  const userCredits = userInfo.credits;
  const needsCredits = 120 - userCredits;
  let creditsFromPlan = 0;
  //assumming 12-18 credits a semester, then

  const reqsInPlan = [];

  while (creditsFromPlan < needsCredits && reqCourses.length > 0) {
    // add left courses from left to right,
    reqsInPlan.push(reqCourses.shift());
    creditsFromPlan += 3; //default credit amount (until we get credit data)
  }

  //now coursesInPlan either contains all required courses OR has meet the necessary credit limit
  const remaining = needsCredits - creditsFromPlan;
  const num_classes = Math.floor(remaining / 3); //default credit amount (until we get credit data)
  let addtlInPlan = [];

  if (remaining > 0) {
    const systemPrompt = `You are part of an academic planning agent. Here is the user's info:
    
    ${JSON.stringify(userInfo, null, 2)}
    
    Required courses for their major have already been selected. Now, the user needs ${num_classes} classes
    of additional courses needed for graduation. Please select them from the list below:

    ${addtlCourses.join("\n")}

    And return your answer as a list of classes as requested in JSON format. Course names should be
    followed by the title (i.e., ECON 101 PRINCIPLES OF MICROECONOMICS"). ALL COURSES SHOULD BE IN CAPITAL 
    LETTERS (CAPS LOCK). Also, **only use courses mentioned in the provided list**.
    `;
    const openaiMessages = [{ role: "system", content: systemPrompt }];

    const chatCompletion = await openai.responses.parse({
      model: "gpt-4.1-nano",
      input: openaiMessages,
      text: {
        format: zodTextFormat(coursesSchema, "pickedCourses"),
      },
    });

    addtlInPlan = chatCompletion.output_parsed.courses;
  }

  const reqs_and_addtl = [...reqsInPlan, ...addtlInPlan];
  return reqs_and_addtl;
}
export async function generateDraftPlan(userInfo, courses) {
  const systemPrompt = `You are part of an academic planning agent. Here is the user's info:
    
    ${JSON.stringify(userInfo, null, 2)}
    
    A list of courses for their major has already been created:

    ${courses.join("\n")}

    Please order these classes into a schema provided:
    {
    "yearPlans": [
      { "year": 1, "semesters": [{ "name": "Fall", "courses": [] }, { "name": "Spring", "courses": [] }] },
      { "year": 2, "semesters": [{ "name": "Fall", "courses": [] }, { "name": "Spring", "courses": [] }] },
      { "year": 3, "semesters": [{ "name": "Fall", "courses": [] }, { "name": "Spring", "courses": [] }] },
      { "year": 4, "semesters": [{ "name": "Fall", "courses": [] }, { "name": "Spring", "courses": [] }] }
    ]
    }

    Each semester should have between 3-5 classes. Please add **all** the classes provided into the schema, leaving no 
    gap semesters (unless the user has said so). Additionally, please note any user preferences in the specificDetails 
    parameter, such as "I don't want Math 240 in my plan" or "I would like only 3 classes in my 2nd year fall semester".
    `;
  const openaiMessages = [{ role: "system", content: systemPrompt }];

  const chatCompletion = await openai.responses.parse({
    model: "gpt-4o",
    input: openaiMessages,
    text: {
      format: zodTextFormat(fourYearPlanSchema, "draftPlan"),
    },
  });

  const draftPlan = chatCompletion.output_parsed;
  const formatted = formatAcademicPlan(draftPlan);
  console.log(formatted);
  return draftPlan;
}

//this plan nw
// needs 80 credits, over 3 years
// --> 26.66 credits a year
// 14 credits a semester (assuming each class is 3 credits)

// const systemPrompt = `You are part of a step in an academic planning agent that creates a course plan
// for a user at UW-Madison. Your job is to combine a list of required courses and a list of additional
// courses into a four year plan structure. This structure should not contain any duplicates, and should be ordered
// chronologically, in semesters and years.

// In general, please order classes logically. For instance, COMP SCI 300 should come before COMP SCI 400 because
// 400 > 300. In general, higher number classes tend to come later in the plan, and lower number courses tend to come
// earlier in the plan.

// The required courses are here:
// ${reqCourses}

// And the additional courses are here:
// ${addtlCourses}

// Please also consider the userInfo:
// ${JSON.stringify(userInfo, null, 2)}

// Please generate an academic plan for the user. Return your response in a structured form as requested.
// The goal is such that the student has 120 credits in their entire plan. However, they can graduate in fewer than 4
// years if this is accomplished. For each year, please separate classes into the Fall and Spring semester only.
// Each year should be enumerated in the range 1-N, where N is the number of years the user will be at school for.

// Course Names should be followed by the title (i.e., ECON 101 PRINCIPLES OF MICROECONOMICS"). ALL COURSES
// SHOULD BE IN CAPITAL LETTERS (CAPS LOCK).

// Also, **only use courses mentioned in the addiitonal courses or required courses**.
// Ensure every class in the required courses *is present in the plan*.
// `;

//In general, each course has 3-4 credits. Please keep in mind that in order to graduate, the user's credits should
// ultimately be at least 120. The goal is such that the student has 120 credits in their entire plan. However, they can
// graduate in fewer than 4 years if this is accomplished. For each year, please separate classes into the Fall and Spring semester only.
// Each year should be enumerated in the range 1-N, where N is the number of years the user will be at school for. In general,
// each semester should contain 12-18 credits( 3-5 classes)
// console.log(systemPrompt);
// const openaiMessages = [{ role: "system", content: systemPrompt }];

// const chatCompletion = await openai.responses.parse({
//   model: "gpt-4.1-nano",
//   input: openaiMessages,
//   text: {
//     format: zodTextFormat(fourYearPlanSchema, "academicPlan"),
//   },
// });

// const uncheckedPlan = chatCompletion.output_parsed;

// const formatted = formatAcademicPlan(uncheckedPlan);
// console.log(formatted);
// return uncheckedPlan;

export async function checkPrereqs(userInfo, plan) {}

export async function searchCourses(userInfo, supabaseClient, conversation) {
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

  const filter = { needs_grad_standing: !userInfo.isUndergrad };
  const count = 10;

  const similarity_output = await vector_similarity_search(
    openai,
    supabaseClient,
    rewrittenQuery,
    count,
    filter
  );
  const kwd_output = await kwd_similarity_search(
    supabaseClient,
    rewrittenQuery,
    count,
    filter
  );

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
    const course_id = r.id;

    const courseName = meta.course_name;
    const subjectName = meta.subject_name;

    const fullStr = `${courseName}${subjectName ? ` ${subjectName}` : ""}`;
    const courseLink = `[${fullStr}](http://localhost:3000/courses/${course_id})`;

    const fullRegex = new RegExp(`\\b${fullStr}\\b`, "g");
    if (fullRegex.test(finalOutput)) {
      finalOutput = finalOutput.replace(fullRegex, courseLink);
    }
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

export async function getNormalResponse(conversation) {
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
}
