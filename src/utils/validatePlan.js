import prereqMap from "@/app/db/prereqMap.json";

/**
 * Normalize course code for fuzzy matching.
 * E.g., "COMP SCI 400" => "COMPSCI400"
 */
function normalizeCourseId(id) {
  return id.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Split a prereq string like "COMPSCI, ECE 354" into array of options.
 * E.g., "COMPSCI, ECE 354" -> ["COMP SCI 354", "ECE 354"]
 * (handles cases like "COMP SCI 354" -> ["COMP SCI 354"])
 */
function splitPrereqOptions(prereq) {
  // Replace slashes with comma for robustness
  const pr = prereq.replace(/\//g, ",");
  // Split on comma and trim, then add back the number if needed
  // E.g. ["COMPSCI", " ECE 354"] => ["COMPSCI 354", "ECE 354"]
  if (pr.includes(",")) {
    const num = pr.match(/\d{3}/);
    if (!num) return pr.split(",").map(s => s.trim());
    return pr.split(",").map(option => {
      // If option contains a number, return as is
      if (/\d{3}/.test(option)) return option.trim();
      // Else, append the number from the original
      return option.trim() + " " + num[0];
    });
  }
  return [pr.trim()];
}

/**
 * Given a plan, returns array of {courseId, unmet: [prereq, ...]}
 */
export function validateFourYearPlan(plan) {
  let taken = [];
  let warnings = [];

  // Flatten plan into ordered course list
  const orderedCourses = [];
  plan.forEach((yearObj, yearIdx) => {
    ["fall", "spring"].forEach((sem) => {
      yearObj[sem].forEach((course, idx) => {
        orderedCourses.push({
          ...course,
          year: yearIdx,
          sem,
          idx,
        });
      });
    });
  });

  for (let i = 0; i < orderedCourses.length; ++i) {
    const course = orderedCourses[i];
    const idNorm = normalizeCourseId(course.id);

    // Find prereqs for this course
    let prereqs = [];
    for (const [target, requiredArr] of Object.entries(prereqMap)) {
      if (normalizeCourseId(target) === idNorm) {
        prereqs = requiredArr;
        break;
      }
    }
    if (!prereqs || prereqs.length === 0) {
      taken.push(course);
      continue;
    }

    const takenNormIds = taken.map((c) => normalizeCourseId(c.id));
    const unmet = prereqs.filter((pr) => {
      // Handle multiple options (e.g., "COMPSCI, ECE 354")
      const options = splitPrereqOptions(pr);
      // If any of the options have been taken, prereq is met
      return !options.some(opt => takenNormIds.includes(normalizeCourseId(opt)));
    });

    if (unmet.length > 0) {
      warnings.push({
        courseId: course.id,
        unmet,
      });
    }

    taken.push(course);
  }

  return warnings;
}
