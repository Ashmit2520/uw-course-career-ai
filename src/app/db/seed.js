const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const csv = require('csv-parser');

// Paths
const dbFile = path.join(__dirname, '../../../courses.db');
const csvFile = path.join(__dirname, 'grades.csv');

// Connect to DB
const db = new Database(dbFile);

// Prepare the INSERT statement
const insert = db.prepare(`
  INSERT OR REPLACE INTO courses (
    college, department, subject_code, subject_name_section, class_description, num_grades, ave_gpa, A, AB, B, BC, C, D, F, S, U, CR, N, P, I, NW, NR, Other
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let rowCount = 0;
fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    insert.run(
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
    rowCount++;
  })
  .on('end', () => {
    console.log(`✅ Loaded ${rowCount} courses into SQLite!`);
    console.log('🎉 Seeding completed successfully. Your database is ready!');
    db.close();
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
    db.close();
  });
