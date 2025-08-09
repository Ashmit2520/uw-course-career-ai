// import { NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// export async function POST(req) {
//   try {
//     const { name, email, password } = await req.json();
//     const { data, error } = await supabase
//       .from("profiles")
//       .insert([{ name, email, password }]);
//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }
//     return NextResponse.json({ data }, { status: 200 });
//   } catch (err) {
//     return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
//   }
// }
