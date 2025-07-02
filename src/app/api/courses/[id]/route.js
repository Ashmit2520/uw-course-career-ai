import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const dbPath = path.join(process.cwd(), 'courses.db');
const db = new Database(dbPath, { readonly: true });

export async function GET(request, { params }) {
  const { id } = params; // id is subject_name_section from the card/link
  const sql = `SELECT * FROM courses WHERE subject_name_section = ? LIMIT 1`;
  const course = db.prepare(sql).get(decodeURIComponent(id));
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  return NextResponse.json(course);
}
