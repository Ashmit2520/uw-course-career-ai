import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'courses.db'));

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  const stmt = db.prepare(`
    SELECT * FROM career_stats
    WHERE LOWER(major) LIKE ?
    ORDER BY major ASC
  `);

  const careers = stmt.all(`%${query}%`);
  return Response.json(careers);
}
