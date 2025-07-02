import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';

const dbPath = path.join(process.cwd(), 'courses.db');
const db = new Database(dbPath, { readonly: true });

export async function GET() {
  const courses = db.prepare('SELECT * FROM courses').all();
  return NextResponse.json(courses);
}
