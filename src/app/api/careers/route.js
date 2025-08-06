import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

// Connect to the SQLite DB
const dbPath = path.join(process.cwd(), "courses.db");
const db = new Database(dbPath);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const query = `
    SELECT *
    FROM career_stats
    WHERE major LIKE ?
    ORDER BY major ASC
  `;

  const results = db.prepare(query).all(`%${q}%`);

  return NextResponse.json(
    results.map((row) => ({
      major: row.major,
      early_career_salary: row.early_career_salary,
      mid_career_salary: row.mid_career_salary,
    }))
  );
}


// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const q = searchParams.get("q")?.toLowerCase() || "";

//   const query = `
//     SELECT * FROM career_stats
//     WHERE LOWER(major) LIKE ?
//     ORDER BY major ASC
//   `;

//   const results = db
//     .prepare(query)
//     .all(`%${q}%`)
//     .map((row) => ({
//       major: row.major,
//       early_career_salary: row.early_career_salary,
//       mid_career_salary: row.mid_career_salary,
//     }));

//   return NextResponse.json(results);
// }
