"use client";
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { validateFourYearPlan } from "../../utils/validatePlan";
import prereqMap from "@/app/db/prereqMap.json";

const STORAGE_KEY = "uwmadison_four_year_plan";

function getSemesterStatus(courses) {
  const credits = semesterCredits(courses);
  if (credits < 12) return { status: "low", message: "Below 12 credits" };
  if (credits > 18) return { status: "high", message: "Above 18 credits" };
  return { status: "ok", message: "" };
}

function savePlanToStorage(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function loadPlanFromStorage(defaultPlan) {
  if (typeof window === "undefined") return defaultPlan;
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultPlan;
}

const INITIAL_PLAN = [
  /* ... your default plan, same as before ... */
  // Copy your INITIAL_PLAN from your file here; omitted for brevity
];

function semesterCredits(courses) {
  return courses.reduce((sum, c) => sum + (c.credits || 0), 0);
}

// Flatten plan into a linear array of course codes in order taken
function getPlanArray(plan) {
  const arr = [];
  plan.forEach((year) => {
    ["fall", "spring"].forEach((sem) => {
      year[sem].forEach((c) => {
        // Extract just the code (e.g. "COMP SCI 300") from the course name
        const match = c.name.match(/^([A-Z ]+\d+)/);
        arr.push(match ? match[1].replace(/\s+/g, " ").trim() : c.name);
      });
    });
  });
  return arr;
}

export default function FourYearPlan() {
  const [plan, setPlan] = useState(() => loadPlanFromStorage(INITIAL_PLAN));
  const [hydrated, setHydrated] = useState(false);
  const [dragged, setDragged] = useState(null);

  // For validation
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    setPlan(loadPlanFromStorage(INITIAL_PLAN));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePlanToStorage(plan);
  }, [plan, hydrated]);

  useEffect(() => {
    savePlanToStorage(plan);
  }, [plan]);

  // Recalculate validation on plan change
  useEffect(() => {
    const planArray = getPlanArray(plan);
    setViolations(validateFourYearPlan(planArray, prereqMap, []));
  }, [plan]);

  // Remove course
  const removeCourse = (yearIdx, sem, courseIdx) => {
    setPlan((prevPlan) => {
      const newPlan = prevPlan.map((y, yi) =>
        yi === yearIdx
          ? {
              ...y,
              [sem]: y[sem].filter((_, ci) => ci !== courseIdx),
            }
          : { ...y }
      );
      return newPlan;
    });
  };

  // Drag & Drop logic
  const onDragStart = (yearIdx, sem, courseIdx) => {
    setDragged({ yearIdx, sem, courseIdx });
  };
  const onDrop = (toYearIdx, toSem) => {
    if (!dragged || (dragged.yearIdx === toYearIdx && dragged.sem === toSem)) {
      setDragged(null);
      return;
    }
    // Remove from old semester
    const course = plan[dragged.yearIdx][dragged.sem][dragged.courseIdx];
    const updatedPlan = plan.map((y, yi) => ({
      ...y,
      fall:
        yi === dragged.yearIdx && dragged.sem === "fall"
          ? y.fall.filter((_, i) => i !== dragged.courseIdx)
          : [...y.fall],
      spring:
        yi === dragged.yearIdx && dragged.sem === "spring"
          ? y.spring.filter((_, i) => i !== dragged.courseIdx)
          : [...y.spring],
    }));
    // Add to new semester
    updatedPlan[toYearIdx][toSem] = [...updatedPlan[toYearIdx][toSem], course];
    setPlan(updatedPlan);
    setDragged(null);
  };

  if (!hydrated) return null;

  return (
    <div
      className="bg-white shadow-xl rounded-xl px-6 py-8 flex flex-col"
      style={{
        minWidth: 650,
        maxWidth: 900,
        width: "100%",
        marginLeft: 32,
        marginRight: 0,
      }}
    >
      <h3 className="text-2xl font-extrabold mb-6 text-gray-900 text-center">
        4-Year Academic Plan (Computer Science)
      </h3>

      {/* Validation UI */}
      {violations.length > 0 && (
        <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <div className="font-semibold text-yellow-800 mb-1">
            ⚠️ Prerequisite Issues Detected:
          </div>
          <ul className="text-sm text-yellow-700 ml-4 list-disc">
            {violations.map((v, i) => (
              <li key={i}>
                <span className="font-semibold">{v.course}</span> (Semester {v.semester}): Missing&nbsp;
                <span className="font-mono text-red-600">
                  {v.missing.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {plan.map((year, yIdx) => (
          <div
            key={yIdx}
            className="border rounded-lg bg-gray-50 p-3 flex flex-col"
            style={{ minWidth: 150, maxWidth: 210 }}
          >
            <div className="font-bold text-lg text-gray-900 mb-2 text-center" style={{ color: "#1a202c" }}>
              Year {year.year}
            </div>
            {["fall", "spring"].map((sem) => {
              const { status, message } = getSemesterStatus(year[sem]);
              return (
                <div
                  key={sem}
                  className={`mb-4 rounded p-2 min-h-[120px] flex-1 border-2 ${
                    status === "low"
                      ? "border-red-400 bg-red-100"
                      : status === "high"
                      ? "border-orange-400 bg-orange-100"
                      : "border-gray-200 bg-gray-200"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(yIdx, sem)}
                >
                  <div className="font-semibold text-gray-800 mb-1 flex items-center justify-between">
                    <span>
                      {sem[0].toUpperCase() + sem.slice(1)}{" "}
                      <span className="text-xs text-gray-600">
                        ({semesterCredits(year[sem])} cr)
                      </span>
                    </span>
                    {status !== "ok" && (
                      <span className="text-xs font-bold text-red-500 ml-2">
                        {message}
                      </span>
                    )}
                  </div>
                  {year[sem].length === 0 && (
                    <div className="text-gray-400 text-xs italic">
                      Drop courses here
                    </div>
                  )}
                  {year[sem].map((course, cIdx) => (
                    <div
                      key={course.id}
                      className="bg-blue-50 mb-2 px-2 py-1 rounded text-base cursor-move border flex items-center justify-between group"
                      draggable
                      onDragStart={() => onDragStart(yIdx, sem, cIdx)}
                    >
                      <span className="text-gray-900 font-medium">
                        {course.name}{" "}
                        <span className="text-xs text-gray-500">
                          ({course.credits} cr)
                        </span>
                      </span>
                      <button
                        onClick={() => removeCourse(yIdx, sem, cIdx)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        aria-label="Remove course"
                        tabIndex={0}
                      >
                        <IoClose size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
