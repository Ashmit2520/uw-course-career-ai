const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync');

// ---- 1. Load CSV Data ----

const dbPath = path.join(__dirname, '../db/grades.csv'); // Update to your actual data filename if needed
const csv = fs.readFileSync(dbPath, 'utf-8');
const records = parse.parse(csv, {
  columns: true,
  skip_empty_lines: true,
});

// ---- 2. Build Reverse Prerequisite Map ----

const prereqForMap = {}; // { 'COMPSCI 537': ['COMPSCI642', 'COMPSCI506'], ... }
const allCourses = new Set();

records.forEach((row) => {
  const course = row['course_name']?.trim();
  allCourses.add(course);
  const satisfies = row['satisfies']?.trim();
  if (!course) return;
  if (!satisfies) return;

  // supports multi-course: "COMPSCI642; COMPSCI506"
  satisfies.split(';').forEach((target) => {
    const cleanTarget = target.trim();
    if (!cleanTarget) return;
    if (!prereqForMap[course]) prereqForMap[course] = [];
    prereqForMap[course].push(cleanTarget);
  });
});

// ---- 3. Build Prerequisite Map (corrected logic) ----
const prereqMap = {}; // { 'COMPSCI642': [ 'COMPSCI 537', ...], ... }

allCourses.forEach((targetCourse) => {
  // targetCourse could be "COMPSCI 642" or "MATH 141"
  // Need to check for matches in satisfies, even if the satisfies omits the space
  const canonical = targetCourse.replace(/\s+/g, ''); // e.g. COMPSCI642
  prereqMap[targetCourse] = [];
  Object.entries(prereqForMap).forEach(([prereq, satisfiesList]) => {
    satisfiesList.forEach((sat) => {
      const satCanonical = sat.replace(/\s+/g, '');
      if (satCanonical === canonical) {
        prereqMap[targetCourse].push(prereq);
      }
    });
  });
});


// ---- 4. Save JSON Files ----

fs.writeFileSync(
  path.join(__dirname, '../db/prereqForMap.json'),
  JSON.stringify(prereqForMap, null, 2)
);

fs.writeFileSync(
  path.join(__dirname, '../db/prereqMap.json'),
  JSON.stringify(prereqMap, null, 2)
);

console.log('✅ Prerequisite mappings generated!');
console.log(`- Prereq-for map: src/app/db/prereqForMap.json`);
console.log(`- Prereq map: src/app/db/prereqMap.json`);
