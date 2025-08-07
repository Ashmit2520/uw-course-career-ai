"use client";
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { validateFourYearPlan } from "@/utils/validatePlan";
import prereqMap from "@/app/db/prereqMap.json";

const STORAGE_KEY = "uwmadison_four_year_plan";
const OVERRIDES_KEY = "uwmadison_prereq_overrides";

// --- Local storage helpers ---
function savePlanToStorage(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}
function loadPlanFromStorage(defaultPlan) {
  if (typeof window === "undefined") return defaultPlan;
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultPlan;
}
function saveOverridesToStorage(overrides) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}
function loadOverridesFromStorage() {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(OVERRIDES_KEY);
  return data ? JSON.parse(data) : {};
}

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
function getSemesterStatus(courses) {
  const credits = semesterCredits(courses);
  if (credits < 12) return { status: "low", message: "Below 12 credits" };
  if (credits > 18) return { status: "high", message: "Above 18 credits" };
  return { status: "ok", message: "" };
}

function normalizeCourseId(id) {
  return id.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

// Helper: does a given course exist anywhere in the plan?
function isCourseInPlan(plan, courseId) {
  // Handle multi-subject courses like "COMPSCI, ECE 354"
  const splitIds = courseId.split(/[,/]/).map(s => s.trim());
  if (!Array.isArray(plan)) return false;

  for (const yearObj of plan) {
    for (const sem of ["fall", "spring"]) {
      for (const c of yearObj[sem]) {
        for (const base of splitIds) {
          if (normalizeCourseId(c.id).includes(normalizeCourseId(base))) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export default function FourYearPlan() {
  const [plan, setPlan] = useState(() => loadPlanFromStorage(INITIAL_PLAN));
  const [hydrated, setHydrated] = useState(false);
  const [dragged, setDragged] = useState(null);
  const [overrides, setOverrides] = useState(() => loadOverridesFromStorage());
  const [warnings, setWarnings] = useState([]);

  // Hydrate plan and overrides from storage
  useEffect(() => {
    setPlan(loadPlanFromStorage(INITIAL_PLAN));
    setOverrides(loadOverridesFromStorage());
    setHydrated(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (hydrated) savePlanToStorage(plan);
  }, [plan, hydrated]);
  useEffect(() => {
    if (hydrated) saveOverridesToStorage(overrides);
  }, [overrides, hydrated]);

  // Compute warnings when plan changes
  useEffect(() => {
    setWarnings(validateFourYearPlan(plan, overrides));
  }, [plan, overrides]);

  // Remove course from semester
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

  // Warning display, override button, and AP credit message
  function getWarning(course, plan) {
    const found = warnings.find((w) => w.courseId === course.id);
    if (!found) return null;

    return (
      <span className="text-xs font-bold text-[#ff5470] ml-2 flex flex-col gap-1">
        Prereqs not met:&nbsp;
        {found.unmet.map((pr) => {
          const isOverridden = overrides[pr];
          const inPlan = isCourseInPlan(plan, pr);

          // Debugging: See what we're checking
          // console.log(
          //   "Looking for", pr,
          //   "normalized as", normalizeCourseId(pr),
          //   "in plan?", inPlan
          // );

          return (
            <span key={pr} className="inline-block mr-2">
              {pr}
              {isOverridden ? (
                <>
                  {" "}
                  <span className="text-[#4db6ac]">(Overridden)</span>
                  <button
                    onClick={() => {
                      setOverrides((prev) => {
                        const copy = { ...prev };
                        delete copy[pr];
                        return copy;
                      });
                    }}
                    className="ml-1 p-0.5 rounded-full bg-gray-200 hover:bg-red-200 text-xs text-gray-700 inline-flex items-center"
                    aria-label={`Remove override for ${pr}`}
                    tabIndex={0}
                  >
                    &times;
                  </button>
                  {inPlan && (
                    <span className="block text-xs text-[#64b5f6] mt-1">
                      You have already overridden {pr} through transfer/AP credit, you don't need to have it in the plan.
                    </span>
                  )}
                </>
              ) : (
                <button
                  onClick={() =>
                    setOverrides((prev) => ({ ...prev, [pr]: true }))
                  }
                  className="ml-2 px-2 py-0.5 rounded bg-[#64b5f6] hover:bg-blue-200 text-zinc-900 text-xs"
                  aria-label={`Override prereq ${pr} with AP/Transfer credit`}
                  tabIndex={0}
                >
                  Override (AP/Transfer) &times;
                </button>
              )}
            </span>
          );
        })}
      </span>
    );
  }


  if (!hydrated) return null;

  return (
    <div
      className="bg-theme-card shadow-xl rounded-xl px-6 py-8 flex flex-col border border-grey-200"
      style={{
        minWidth: 650,
        maxWidth: 900,
        width: "100%",
        marginLeft: 32,
        marginRight: 0,
      }}
    >
      <h3 className="text-2xl font-extrabold mb-6 text-white text-center">
        4-Year Academic Plan
      </h3>
      <div className="grid grid-cols-4 gap-6 w-full">
        {plan.map((year, yIdx) => (
          <div
            key={yIdx}
            className="border border-grey-200 rounded-lg bg-indigo-950 p-3 flex flex-col flex-1 min-w-[180px]"
            style={{ minWidth: 150, maxWidth: 210 }}
          >
            <div className="font-bold text-lg text-white mb-2 text-center">
              Year {year.year}
            </div>
            {["fall", "spring"].map((sem) => {
              const { status, message } = getSemesterStatus(year[sem]);
              return (
                <div
                  key={sem}
                  className={`mb-4 rounded p-2 flex flex-col flex-1 border-2 w-full ${
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
                  {/* This flex-col + gap-2 replaces mb-2 on cards */}
                  <div className="flex flex-col gap-2 w-full">
                    {year[sem].map((course, cIdx) => (
                      <div
                        key={course.id + cIdx}
                        className="bg-white px-2 py-2 rounded text-base cursor-move border flex items-center justify-between group w-full"
                        draggable
                        onDragStart={() => onDragStart(yIdx, sem, cIdx)}
                        style={{ minHeight: 44, wordBreak: "break-word", whiteSpace: "normal" }}
                      >
                        <span className="text-slate-700 font-medium w-full break-words">
                          {course.name}{" "}
                          <span className="text-xs text-gray-500">
                            ({course.credits} cr)
                          </span>
                          {getWarning(course, plan)}
                        </span>
                        <button
                          onClick={() => removeCourse(yIdx, sem, cIdx)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-100 group-hover:opacity-100 transition"
                          aria-label="Remove course"
                          tabIndex={0}
                        >
                          <IoClose size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
