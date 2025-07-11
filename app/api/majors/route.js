import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const dbPath = path.join(process.cwd(), 'courses.db');


export async function GET(request) {
  const db = new Database(dbPath, { readonly: true });
  console.log("📁 Reading from DB:", dbPath);

  const search = request.nextUrl.searchParams.get('q');

  let majors;
  if (search) {
    majors = db.prepare(
      `SELECT * FROM majors WHERE major LIKE ?`
    ).all(`%${search}%`);
  } else {
    majors = db.prepare(`SELECT * FROM majors`).all();
  }
  db.close();
  return NextResponse.json(majors);
}
 