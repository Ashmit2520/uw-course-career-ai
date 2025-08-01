import { createClient } from "@/app/api/supabase/server";
import { NextResponse } from "next/server";
import {
  router,
  extractUserInfo,
  getReqs,
  getAddtlCourses,
  getNormalResponse,
} from "./llmActions";

export async function POST(req) {
  const { messages } = await req.json();
  const supabase = await createClient();

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
      const p0 = await getReqs(userInfo, supabase);
      console.log(p0);

      const a0 = await getAddtlCourses(userInfo, p0, supabase);
      const combined = `${p0}\n\nAdditional Courses:\n${a0}`;

      return NextResponse.json({ text: combined });

    case "2":
      const normalResponse = await getNormalResponse(messages);

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
