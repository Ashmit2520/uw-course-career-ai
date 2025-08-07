const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const csv = require('csv-parser');

// Paths
const dbFile = path.join(__dirname, '../../../courses.db');
const careerCsv = path.join(__dirname, 'career_data_clean.csv');

// Open SQLite database
const db = new Database(dbFile);

// Drop and recreate career_stats table
db.exec(`DROP TABLE IF EXISTS career_stats;`);
db.exec(`
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

// Prepare the insert statement
const insertCareer = db.prepare(`
  INSERT INTO career_stats (
    major, unemployment_rate, underemployment_rate, early_career_salary, mid_career_salary,
    grad_degree_share, female_grads, male_grads, hispanic_grads, black_grads,
    native_american_grads, asian_grads, pacific_islander_grads, white_grads,
    multiracial_grads, unknown_grads, intl_grads
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Seed the data
let rowCount = 0;

fs.createReadStream(careerCsv)
  .pipe(csv())
  .on('data', (row) => {
    insertCareer.run(
      row["major"]?.trim() || "Unknown",
      parseFloat(row["unemployment_rate"]) || 0,
      parseFloat(row["underemployment_rate"]) || 0,
      parseInt(row["early_career_salary"]) || 0,
      parseInt(row["mid_career_salary"]) || 0,
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
    rowCount++;
  })
  .on('end', () => {
    console.log(`✅ Loaded ${rowCount} career rows into SQLite!`);
    db.close();
  })
  .on('error', (err) => {
    console.error("❌ Error reading career data:", err);
    db.close();
  });
