const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const csv = require("csv-parser");

// Paths
const dbFile = path.join(__dirname, "../../../courses.db");
const gradesCsv = path.join(__dirname, "grades.csv");
const careerCsv = path.join(__dirname, "career_data.csv");

// Connect to DB
const db = new Database(dbFile);

// --- Create courses table ---
db.exec(`
  DROP TABLE IF EXISTS courses;
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    course_name TEXT,
    subject_name TEXT,
    description TEXT,
    prerequisites TEXT,
    satisfies TEXT,
    students INTEGER,
    avg_gpa REAL,
    grade_a INTEGER,
    grade_ab INTEGER,
    grade_b INTEGER,
    grade_bc INTEGER,
    grade_c INTEGER,
    grade_d INTEGER,
    grade_f INTEGER,
    terms_offered TEXT,
    filename TEXT
  );
`);

const insertCourse = db.prepare(`
  INSERT OR REPLACE INTO courses (
    id, course_name, subject_name, description, prerequisites, satisfies, students, avg_gpa,
    grade_a, grade_ab, grade_b, grade_bc, grade_c, grade_d, grade_f, terms_offered, filename
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// --- Create careers table ---
db.exec(`
  DROP TABLE IF EXISTS career_stats;
  CREATE TABLE IF NOT EXISTS career_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    major TEXT,
    unemployment_rate REAL,
    underemployment_rate REAL,
    early_career_salary INTEGER,
    mid_career_salary INTEGER,
    grad_degree_share REAL,
    female_grads INTEGER,
    male_grads INTEGER,
    hispanic_grads INTEGER,
    black_grads INTEGER,
    native_american_grads INTEGER,
    asian_grads INTEGER,
    pacific_islander_grads INTEGER,
    white_grads INTEGER,
    multiracial_grads INTEGER,
    unknown_grads INTEGER,
    intl_grads INTEGER
  );
`);

const insertCareer = db.prepare(`
  INSERT INTO career_stats (
    major, unemployment_rate, underemployment_rate, early_career_salary, mid_career_salary,
    grad_degree_share, female_grads, male_grads, hispanic_grads, black_grads,
    native_american_grads, asian_grads, pacific_islander_grads, white_grads,
    multiracial_grads, unknown_grads, intl_grads
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let courseRowCount = 0;
let careerRowCount = 0;
let tasksDone = 0;

function checkAllDone() {
  tasksDone++;
  if (tasksDone === 2) {
    console.log("🎉 Seeding completed successfully. Your database is ready!");
    db.close();
  }
}

// Load courses
fs.createReadStream(gradesCsv)
  .pipe(csv())
  .on("data", (row) => {
    insertCourse.run(
      row["id"],
      row["course_name"],
      row["subject_name"],
      row["description"],
      row["prerequisites"],
      row["satisfies"],
      parseInt(row["students"]) || 0,
      parseFloat(row["avg_gpa"]) || null,
      parseInt(row["grade_a"]) || 0,
      parseInt(row["grade_ab"]) || 0,
      parseInt(row["grade_b"]) || 0,
      parseInt(row["grade_bc"]) || 0,
      parseInt(row["grade_c"]) || 0,
      parseInt(row["grade_d"]) || 0,
      parseInt(row["grade_f"]) || 0,
      row["terms_offered"],
      row["filename"]
    );
    courseRowCount++;
  })
  .on("end", () => {
    console.log(`✅ Loaded ${courseRowCount} courses into SQLite!`);
    checkAllDone();
  })
  .on("error", (err) => {
    console.error("Error reading courses CSV:", err);
    db.close();
  });

// Load careers
fs.createReadStream(careerCsv)
  .pipe(csv())
  .on("data", (row) => {
    insertCareer.run(
      row["major"],
      parseFloat(row["unemployment_rate"]) || 0,
      parseFloat(row["underemployment_rate"]) || 0,
      parseInt((row["early_career_salary"] || "").replace(/[^0-9]/g, "")) || 0,
      parseInt((row["mid_career_salary"] || "").replace(/[^0-9]/g, "")) || 0,
      parseFloat(row["grad_degree_share"]) || 0,
      parseInt(row["female_grads"]) || 0,
      parseInt(row["male_grads"]) || 0,
      parseInt(row["hispanic_grads"]) || 0,
      parseInt(row["black_grads"]) || 0,
      parseInt(row["native_american_grads"]) || 0,
      parseInt(row["asian_grads"]) || 0,
      parseInt(row["pacific_islander_grads"]) || 0,
      parseInt(row["white_grads"]) || 0,
      parseInt(row["multiracial_grads"]) || 0,
      parseInt(row["unknown_grads"]) || 0,
      parseInt(row["intl_grads"]) || 0
    );
    careerRowCount++;
  })
  .on("end", () => {
    console.log(`✅ Loaded ${careerRowCount} careers into SQLite!`);
    checkAllDone();
  })
  .on("error", (err) => {
    console.error("Error reading career data:", err);
    db.close();
  });
