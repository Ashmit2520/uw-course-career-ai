// import { createClient } from "@/app/api/supabase/server";
import { NextResponse } from "next/server";
import {
  router,
  extractUserInfo,
  getReqs,
  getAddtlCourses,
  getNormalResponse,
  combineReqsAndAddtl,
  searchCourses,
} from "./llmActions";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const { messages } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const courseOfAction = await router(messages);

  console.log(courseOfAction);
  switch (courseOfAction) {
    case "1":
      const userInfo = await extractUserInfo(messages, supabase);

      if (!userInfo.major || userInfo.major.trim() === "") {
        return NextResponse.json({
          text: "Could you please tell me what major you're interested in?",
        });
      }
      if (userInfo.academicInterests.length === 0) {
        return NextResponse.json({
          text: "Could you please tell me a bit about your academic interestss?",
        });
      }
      const r0 = await getReqs(userInfo, messages, supabase);
      console.log(r0);

      const a0 = await getAddtlCourses(userInfo, supabase);

      const finalPlan = await combineReqsAndAddtl(userInfo, r0, a0);
      return NextResponse.json({ text: finalPlan });

    case "2":
      const userInfo2 = await extractUserInfo(messages, supabase);
      const responseToCourses = await searchCourses(
        userInfo2,
        supabase,
        messages
      );
      return NextResponse.json({ text: responseToCourses });

    case "3":
      const normalResponse = await getNormalResponse(messages);
      console.log("NORMAL", normalResponse);
      return NextResponse.json({ text: normalResponse });

    // // case "3":
    //   // Statements to execute if expression matches value3
    //   break;
    // case "4":

    default:
      break;
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
