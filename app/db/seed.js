const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const csv = require('csv-parser');

// Paths
const dbFile = path.join(__dirname, '../../../courses.db');
const gradesCsv = path.join(__dirname, 'grades.csv');
const majorsCsv = path.join(__dirname, 'salaries_by_college_major.csv');

// Connect to DB
const db = new Database(dbFile);

// --- Create courses table for new schema ---
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

let courseRowCount = 0;
fs.createReadStream(gradesCsv)
  .pipe(csv())
  .on('data', (row) => {
    insertCourse.run(
      row['id'],
      row['course_name'],
      row['subject_name'],
      row['description'],
      row['prerequisites'],
      row['satisfies'],
      parseInt(row['students']) || 0,
      parseFloat(row['avg_gpa']) || null,
      parseInt(row['grade_a']) || 0,
      parseInt(row['grade_ab']) || 0,
      parseInt(row['grade_b']) || 0,
      parseInt(row['grade_bc']) || 0,
      parseInt(row['grade_c']) || 0,
      parseInt(row['grade_d']) || 0,
      parseInt(row['grade_f']) || 0,
      row['terms_offered'],
      row['filename']
    );
    courseRowCount++;
  })
  .on('end', () => {
    console.log(`✅ Loaded ${courseRowCount} courses into SQLite!`);
    seedMajors();
  })
  .on('error', (err) => {
    console.error('Error reading courses CSV:', err);
    db.close();
  });

// --- Seed majors table ---
function seedMajors() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS majors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      major TEXT,
      starting_median_salary REAL,
      mid_career_median_salary REAL,
      mid_career_10th_percentile_salary REAL,
      mid_career_25th_percentile_salary REAL,
      mid_career_75th_percentile_salary REAL,
      mid_career_90th_percentile_salary REAL
    )
  `).run();

  const insertMajor = db.prepare(`
    INSERT INTO majors (major, starting_median_salary, mid_career_median_salary, mid_career_10th_percentile_salary, mid_career_25th_percentile_salary, mid_career_75th_percentile_salary, mid_career_90th_percentile_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let majorRowCount = 0;
  fs.createReadStream(majorsCsv)
    .pipe(csv())
    .on('data', (row) => {
      insertMajor.run(
        row['Undergraduate Major'],
        row['Starting Median Salary'],
        row['Mid-Career Median Salary'],
        row['Mid-Career 10th Percentile Salary'],
        row['Mid-Career 25th Percentile Salary'],
        row['Mid-Career 75th Percentile Salary'],
        row['Mid-Career 90th Percentile Salary']
      );
      majorRowCount++;
    })
    .on('end', () => {
      console.log(`✅ Loaded ${majorRowCount} majors/salaries into SQLite!`);
      console.log('🎉 Seeding completed successfully. Your database is ready!');
      db.close();
    })
    .on('error', (err) => {
      console.error('Error reading majors CSV:', err);
      db.close();
    });
}
