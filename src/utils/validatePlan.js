// src/app/utils/validatePlan.js

/**
 * Validates a course plan against the prereqMap.
 * 
 * @param {string[]} planArray - Array of course codes in order taken (e.g. ["MATH 221", "COMP SCI 300", ...])
 * @param {Object} prereqMap - Object: course code -> [array of required prereqs]
 * @param {string[]} alreadySatisfied - Extra satisfied prereqs (AP, transfer, etc.)
 * @returns {Array<{course: string, semester: number, missing: string[]}>}
 */
function validateFourYearPlan(planArray, prereqMap, alreadySatisfied = []) {
  const completed = new Set(alreadySatisfied);
  const violations = [];
  for (let i = 0; i < planArray.length; i++) {
    const course = planArray[i];
    if (!course) continue;
    const prereqs = prereqMap[course] || [];
    const missing = prereqs.filter(prereq => !completed.has(prereq));
    if (missing.length > 0) {
      violations.push({
        course,
        semester: i + 1,
        missing,
      });
    }
    completed.add(course);
  }
  return violations;
}

export { validateFourYearPlan };
