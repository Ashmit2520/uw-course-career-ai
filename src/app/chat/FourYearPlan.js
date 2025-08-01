"use client";
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { validateFourYearPlan } from "@/utils/validatePlan";
import prereqMap from "@/app/db/prereqMap.json";

const STORAGE_KEY = "uwmadison_four_year_plan";

// --- Credits check ---
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

// --- ALL IDS AND NAMES ARE THE OFFICIAL COURSE CODE ---
const INITIAL_PLAN = [
  {
    year: 1,
    fall: [
      { id: "COMP SCI 300", name: "COMP SCI 300", credits: 3 },
      { id: "MATH 221", name: "MATH 221", credits: 5 },
      { id: "COMM-A", name: "Communications Part A", credits: 3 },
      { id: "ETHNIC", name: "Ethnic Studies", credits: 3 },
    ],
    spring: [
      { id: "COMP SCI 240", name: "COMP SCI 240", credits: 3 },
      { id: "MATH 222", name: "MATH 222", credits: 4 },
      { id: "LANG2", name: "Second Semester Language", credits: 4 },
      { id: "BIO-SCI", name: "Natural Science (Biological)", credits: 3 },
    ],
  },
  {
    year: 2,
    fall: [
      { id: "COMP SCI 354", name: "COMP SCI 354", credits: 3 },
      { id: "COMP SCI 400", name: "COMP SCI 400", credits: 3 },
      { id: "LINEAR", name: "Linear Algebra", credits: 3 },
      { id: "HUM1", name: "Humanities/Literature", credits: 3 },
      { id: "NAT-SCI2", name: "Natural Science (Physical)", credits: 3 },
    ],
    spring: [
      { id: "COMP SCI 407", name: "COMP SCI 407", credits: 3 },
      { id: "PROB-STAT", name: "Probability/Statistics", credits: 3 },
      { id: "LANG3", name: "Third Semester Language", credits: 3 },
      { id: "SOCSCI1", name: "Social Science", credits: 3 },
      { id: "HUM2", name: "Humanities", credits: 3 },
    ],
  },
  {
    year: 3,
    fall: [
      { id: "COMP SCI 537", name: "COMP SCI 537", credits: 3 },
      { id: "APP1", name: "Applications Requirement", credits: 3 },
      { id: "COMP SCI 577", name: "COMP SCI 577", credits: 3 },
      { id: "SOCSCI2", name: "Social Science", credits: 3 },
      { id: "ELECTIVE1", name: "Comp Sci Elective", credits: 3 },
    ],
    spring: [
      { id: "COMP SCI 540", name: "COMP SCI 540", credits: 3 },
      { id: "COMP SCI 564", name: "COMP SCI 564", credits: 3 },
      { id: "ELECTIVE2", name: "Comp Sci Elective", credits: 3 },
      { id: "HUM3", name: "Humanities/Literature", credits: 3 },
      { id: "SOCSCI3", name: "Social Science", credits: 3 },
    ],
  },
  {
    year: 4,
    fall: [
      { id: "COMP SCI 620", name: "COMP SCI 620", credits: 3 },
      { id: "ELECTIVE3", name: "Comp Sci Elective", credits: 3 },
      { id: "UPPERLVL", name: "Upper-level Elective", credits: 3 },
      { id: "NAT-SCI3", name: "Natural Science", credits: 3 },
      { id: "FREE1", name: "Free Elective", credits: 3 },
    ],
    spring: [
      { id: "ELECTIVE4", name: "Comp Sci Elective", credits: 3 },
      { id: "SOCSCI4", name: "Social Science", credits: 3 },
      { id: "FREE2", name: "Free Elective", credits: 3 },
      { id: "UPPERLVL2", name: "Upper-level Elective", credits: 3 },
      { id: "FREE3", name: "Free Elective", credits: 3 },
    ],
  },
];

function semesterCredits(courses) {
  return courses.reduce((sum, c) => sum + (c.credits || 0), 0);
}

export default function FourYearPlan() {
  const [plan, setPlan] = useState(() => loadPlanFromStorage(INITIAL_PLAN));
  const [hydrated, setHydrated] = useState(false);
  const [dragged, setDragged] = useState(null);
  const [warnings, setWarnings] = useState([]);

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

  // Prereq warnings
  useEffect(() => {
    const _warnings = validateFourYearPlan(plan);
    setWarnings(_warnings);
    console.log("Current warnings:", _warnings); // <--- See what's not being satisfied!
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

  // Show nothing until hydrated
  if (!hydrated) return null;

  // Helper for warning display
  function getWarning(course) {
    const found = warnings.find(
      (w) => w.courseId === course.id
    );
    if (found) {
      return (
        <span className="text-xs font-bold text-red-500 ml-2">
          Prereqs not met: {found.unmet.join(", ")}
        </span>
      );
    }
    return null;
  }

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
                      key={course.id + cIdx}
                      className="bg-blue-50 mb-2 px-2 py-1 rounded text-base cursor-move border flex items-center justify-between group"
                      draggable
                      onDragStart={() => onDragStart(yIdx, sem, cIdx)}
                    >
                      <span className="text-gray-900 font-medium">
                        {course.name}{" "}
                        <span className="text-xs text-gray-500">
                          ({course.credits} cr)
                        </span>
                        {getWarning(course)}
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
