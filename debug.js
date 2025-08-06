import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "courses.db");
const db = new Database(dbPath, { readonly: true });

const debug = db.prepare(`
  SELECT * FROM courses WHERE LOWER(subject_name) LIKE '%comp sci%'
`).all();
console.log("🧪 Manual COMP SCI test:", debug);
