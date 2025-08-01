// src/utils/validatePlan.js

import prereqMap from "@/app/db/prereqMap.json";

function normalizeCourseName(str) {
  return str.replace(/\s+/g, "").toUpperCase();
}

/**
 * Accepts the flattened list of completed course IDs (["COMP SCI 300", ...])
 * and returns true if any of the alternate options are satisfied
 */
function isPrereqMet(prereqStr, completedSet) {
  // Support: "COMPSCI, ECE 354" or "CHICLA/SPANISH 222"
  const options = prereqStr
    .split(/[\/,]/) // split on "/" or ","
    .map(s => s.trim().replace(/\s+/g, " "));
  return options.some(option => {
    // Try both "COMP SCI 354" and "COMPSCI 354" as IDs
    const normalized = normalizeCourseName(option);
    for (let completed of completedSet) {
      const completedNormalized = normalizeCourseName(completed);
      if (completedNormalized === normalized) return true;
    }
    return false;
  });
}

export function validateFourYearPlan(plan) {
  // Flatten plan into array of semesters
  let completed = new Set();
  let warnings = [];
  for (const year of plan) {
    for (const sem of ["fall", "spring"]) {
      for (const course of year[sem]) {
        const courseId = course.id;
        const prereqs = prereqMap[courseId] || [];
        const unmet = [];
        for (const prereq of prereqs) {
          if (!isPrereqMet(prereq, completed)) {
            unmet.push(prereq);
          }
        }
        if (unmet.length) {
          warnings.push({ courseId, unmet });
        }
        completed.add(courseId);
      }
    }
  }
  return warnings;
}
