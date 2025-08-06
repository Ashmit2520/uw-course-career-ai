import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const dbPath = path.join(process.cwd(), 'courses.db');
const db = new Database(dbPath, { readonly: true });

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Pagination and query
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 18);

  // Sorting
  let sort = searchParams.get('sort') || 'course_name'; // Default to course name
  let direction = searchParams.get('direction') || 'asc';

  // Only allow certain fields to sort by
  const allowedSorts = {
    'avg_gpa': 'avg_gpa',
    'students': 'students',
    'course_name': 'course_name'
  };
  sort = allowedSorts[sort] || 'course_name';
  direction = direction === 'desc' ? 'DESC' : 'ASC';

  // Searching
  const search = searchParams.get('search') || '';
  let sql = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (search) {
    sql += ` AND (LOWER(course_name) LIKE ? OR LOWER(subject_name) LIKE ? OR LOWER(description) LIKE ?)`;
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY ${sort} ${direction}`;
  sql += ' LIMIT ? OFFSET ?';
  params.push(pageSize, pageSize * (page - 1));

  const courses = db.prepare(sql).all(...params);

  // Total count for pagination
  let countSql = 'SELECT COUNT(*) as total FROM courses WHERE 1=1';
  if (search) {
    countSql += ` AND (LOWER(course_name) LIKE ? OR LOWER(subject_name) LIKE ? OR LOWER(description) LIKE ?)`;
  }
  const countParams = search ? [ `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`, `%${search.toLowerCase()}%` ] : [];
  const { total } = db.prepare(countSql).get(...countParams);

  return NextResponse.json({ courses, total });
}
