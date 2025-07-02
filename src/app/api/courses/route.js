import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

// Find absolute path to your DB file
const dbPath = path.join(process.cwd(), 'courses.db');
const db = new Database(dbPath, { readonly: true });

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Get query parameters
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department');
  const code = searchParams.get('code');

  // Build SQL query dynamically
  let sql = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (search) {
    sql += ` AND (LOWER(subject_name_section) LIKE ? OR LOWER(department) LIKE ? OR LOWER(class_description) LIKE ? OR LOWER(subject_code) LIKE ?)`;
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s, s);
  }
  if (department) {
    sql += ` AND department = ?`;
    params.push(department);
  }
  if (code) {
    sql += ` AND subject_code = ?`;
    params.push(code);
  }

  // Get filtered courses
  const courses = db.prepare(sql).all(...params);
  return NextResponse.json(courses);
}
