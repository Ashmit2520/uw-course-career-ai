const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Import your parser
const parsePrereq = require('./prereqParser');

const gradesCsvPath = path.join(__dirname, '../db/grades.csv');
const outputJsonPath = path.join(__dirname, '../db/parsedPrereqs.json');
const outliersPath = path.join(__dirname, '../db/parseOutliers.json');

let outlierCount = 0;
const parsedResults = {};
const outliers = [];

let rowNum = 0;

fs.createReadStream(gradesCsvPath)
  .pipe(csv())
  .on('data', (row) => {
    rowNum++;

    const courseId = row.id || row['id'];
    const courseName = row.course_name || row['course_name'];
    const prereqText = row.prerequisites || row['prerequisites'];

    const parsed = parsePrereq(prereqText);

    parsedResults[courseId] = {
      course_name: courseName,
      prerequisites: prereqText,
      parsed,
    };

    // Only log ambiguous or "empty" parses as outliers
    const isOutlier =
      parsed.type === "ambiguous" ||
      (
        (!parsed.requirements || parsed.requirements.length === 0) &&
        (!parsed.nonCourseRequirements || parsed.nonCourseRequirements.length === 0)
      );

    if (isOutlier) {
      outlierCount++;
      outliers.push({
        row: rowNum,
        course_id: courseId,
        course_name: courseName,
        prerequisites: prereqText,
        parsed,
      });

      // Print in the requested format:
      console.log(`⚠️ Outlier at row ${rowNum}: [${courseName}] "${prereqText}"`);
      console.log(`   Parsed Output: ${JSON.stringify(parsed, null, 2)}`);
    }
  })
  .on('end', () => {
    fs.writeFileSync(outputJsonPath, JSON.stringify(parsedResults, null, 2));
    fs.writeFileSync(outliersPath, JSON.stringify(outliers, null, 2));
    console.log(`\n✅ Done. Parsed ${Object.keys(parsedResults).length} courses.`);
    console.log(`⚠️  Outlier/flagged cases: ${outlierCount}`);
    if (outlierCount > 0) {
      console.log(`🔎 See flagged outliers at ${outliersPath}`);
    }
  });
