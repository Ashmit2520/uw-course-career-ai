import { NextResponse } from "next/server";
import {
  router,
  extractUserInfo,
  getReqs,
  getAddtlCourses,
  getNormalResponse,
  combineReqsAndAddtl,
  searchCourses,
  generateDraftPlan,
  checkPrereqs,
  makeMinorChange,
} from "./llmActions";
import respondToCareerQuestion from "./careerResponses";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const { messages, plan } = await req.json();
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
          updatePlan: false,
        });
      }
      if (userInfo.academicInterests.length === 0) {
        return NextResponse.json({
          text: "Could you please tell me a bit about your academic interestss?",
          updatePlan: false,
        });
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("plan-generation-loading", {
            detail: { isLoading: true },
          })
        );
      }
      const r0 = await getReqs(userInfo, supabase);
      console.log(r0);

      const a0 = await getAddtlCourses(userInfo, supabase);

      const combinedCourses = await combineReqsAndAddtl(userInfo, r0, a0);

      const draftPlan = await generateDraftPlan(userInfo, combinedCourses);
      const b = await checkPrereqs(userInfo, supabase, draftPlan);
      return NextResponse.json({
        text: "I've created your plan!",
        updatePlan: true,
        generatedPlan: draftPlan,
      });

    case "2":
      const userInfo2 = await extractUserInfo(messages, supabase);
      const responseToCourses = await searchCourses(
        userInfo2,
        supabase,
        messages
      );
      console.log(responseToCourses);
      return NextResponse.json({ text: responseToCourses, updatePlan: false });

    case "3":
      const userInfo3 = await extractUserInfo(messages, supabase);
      const responseToCareers = await respondToCareerQuestion(
        userInfo3,
        messages
      );
      console.log(responseToCareers);
      return NextResponse.json({ text: responseToCareers, updatePlan: false });

    case "4":
      const userInfo4 = await extractUserInfo(messages, supabase);
      const editedPlan = await makeMinorChange(
        userInfo4,
        messages,
        plan,
        supabase
      );
      return NextResponse.json({
        text: "I've modified your plan!",
        updatePlan: true,
        generatedPlan: editedPlan,
      });
    case "5":
      const normalResponse = await getNormalResponse(messages);
      console.log("NORMAL", normalResponse);
      return NextResponse.json({ text: normalResponse, updatePlan: true });
    // // case "3":
    //   // Statements to execute if expression matches value3
    //   break;
    // case "4":

    default:
      break;
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
