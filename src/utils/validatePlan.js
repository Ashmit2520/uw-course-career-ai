import prereqMap from "@/app/db/prereqMap.json";

/**
 * Normalize course code to strip spaces, special chars for fuzzy matching.
 * E.g., "COMP SCI 400" => "COMPSCI400"
 */
function normalizeCourseId(id) {
  if (!id || typeof id !== "string") return ""; // handle undefined/null/empty
  return id.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Splits course name + subject name into separate parts (only used by LLM generated plans)
 */
export function extractCode(courseName) {
  // Matches the subject and course number (e.g., COMPSCI 300)
  const match = courseName.match(/^[A-Z ,&/]+ \d+[A-Z]?/);
  return match ? match[0].replace(/\s+/g, " ").trim() : courseName.trim();
}

export function parseLLMPlan(plan) {
  return plan.yearPlans.map((y) => ({
    year: y.year,
    fall: y.semesters
      .find((s) => s.name === "Fall")
      .courses.map((fullName) => ({
        id: extractCode(fullName),
        name: fullName,
        credits: 3,
      })),
    spring: y.semesters
      .find((s) => s.name === "Spring")
      .courses.map((fullName) => ({
        id: extractCode(fullName),
        name: fullName,
        credits: 3,
      })),
  }));
}
/**
 * Given a plan, returns array of {courseId, unmet: [prereq, ...]}
 */
export function validateFourYearPlan(plan) {
  // Build a timeline: all courses taken so far, in order
  let taken = [];
  let warnings = [];

  // Flatten the plan into [course, year, sem, idx] with order
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

  // For each course, check its prereqs
  for (let i = 0; i < orderedCourses.length; ++i) {
    const course = orderedCourses[i];
    const idNorm = normalizeCourseId(course.id);

    // Find prereqs for this course
    let prereqs = [];
    // prereqMap is assumed to be an object { "COMP SCI 400": [...] }
    for (const [target, requiredArr] of Object.entries(prereqMap)) {
      if (normalizeCourseId(target) === idNorm) {
        prereqs = requiredArr;
        break;
      }
    }
    if (!prereqs || prereqs.length === 0) continue;

    // For each prereq, see if it's in taken[] so far
    const takenNormIds = taken.map((c) => normalizeCourseId(c.id));
    const unmet = prereqs.filter((pr) => {
      const prNorm = normalizeCourseId(pr);
      return !takenNormIds.includes(prNorm);
    });

    if (unmet.length > 0) {
      warnings.push({
        courseId: course.id,
        unmet,
      });
    }

    taken.push(course); // Now add course to taken list
  }
  return warnings;
}
