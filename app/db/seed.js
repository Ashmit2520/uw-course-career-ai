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

// --- Seed courses table ---
const insertCourse = db.prepare(`
  INSERT OR REPLACE INTO courses (
    college, department, subject_code, subject_name_section, class_description, num_grades, ave_gpa, A, AB, B, BC, C, D, F, S, U, CR, N, P, I, NW, NR, Other
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let courseRowCount = 0;
fs.createReadStream(gradesCsv)
  .pipe(csv())
  .on('data', (row) => {
    insertCourse.run(
      row['College Name'],
      row['Department Name'],
      row['Subject Code'],
      row['Subject Name + First Section'],
      row['Class Description'],
      row['# Grades'],
      row['Ave GPA'],
      row['A'],
      row['AB'],
      row['B'],
      row['BC'],
      row['C'],
      row['D'],
      row['F'],
      row['S'],
      row['U'],
      row['CR'],
      row['N'],
      row['P'],
      row['I'],
      row['NW'],
      row['NR'],
      row['Other']
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
