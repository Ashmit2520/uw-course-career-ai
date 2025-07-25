import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const dbPath = path.join(process.cwd(), 'courses.db');
const db = new Database(dbPath, { readonly: true });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '18', 10);

  // --- UPDATED COLUMN NAMES HERE ---
  let sql = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (search) {
    sql += ` AND (LOWER(course_name) LIKE ? OR LOWER(subject_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(id) LIKE ?)`;
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s, s);
  }

  sql += ` LIMIT ? OFFSET ?`;
  params.push(pageSize, pageSize * (page - 1));

  const courses = db.prepare(sql).all(...params);

  // Total count for pagination
  let countSql = 'SELECT COUNT(*) as total FROM courses WHERE 1=1';
  const countParams = [];

  if (search) {
    countSql += ` AND (LOWER(course_name) LIKE ? OR LOWER(subject_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(id) LIKE ?)`;
    const s = `%${search.toLowerCase()}%`;
    countParams.push(s, s, s, s);
  }

  const total = db.prepare(countSql).get(...countParams)?.total || 0;

  return NextResponse.json({ courses, total });
}
