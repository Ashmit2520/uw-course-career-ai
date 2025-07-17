"use client";
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Fall", "Spring"];

const fourYearPlan = [
  [
    { code: "COMP SCI 240", name: "Discrete Math", credits: 3 },
    { code: "COMP SCI 252", name: "Intro Computer Engineering", credits: 3 },
    { code: "MATH 221", name: "Calculus I", credits: 5 },
    { code: "COMM-A", name: "Comm A (Breadth)", credits: 3 },
    { code: "ETHNIC", name: "Ethnic Studies", credits: 1 }
  ],
  [
    { code: "COMP SCI 300", name: "Programming II", credits: 3 },
    { code: "MATH 222", name: "Calculus II", credits: 4 },
    { code: "SOC SCI", name: "Social Science Breadth", credits: 3 },
    { code: "LIT", name: "Literature Breadth", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 2 }
  ],
  [
    { code: "COMP SCI 354", name: "Machine Org & Prog", credits: 3 },
    { code: "MATH 340", name: "Linear Algebra", credits: 3 },
    { code: "STAT 324", name: "Intro Statistics", credits: 3 },
    { code: "COMM-B", name: "Comm B (Breadth)", credits: 3 },
    { code: "SOC SCI", name: "Social Science Breadth", credits: 3 }
  ],
  [
    { code: "COMP SCI 400", name: "Programming III", credits: 3 },
    { code: "NAT SCI", name: "Natural Science Breadth", credits: 3 },
    { code: "PHYS SCI", name: "Physical Science Breadth", credits: 3 },
    { code: "ELECT", name: "CS Elective", credits: 3 },
    { code: "ELECT", name: "General Elective", credits: 3 }
  ],
  [
    { code: "COMP SCI 537", name: "Operating Systems", credits: 3 },
    { code: "COMP SCI 540", name: "Artificial Intelligence", credits: 3 },
    { code: "SOC SCI", name: "Social Science Breadth", credits: 3 },
    { code: "BIO SCI", name: "Biological Science", credits: 3 },
    { code: "ELECT", name: "CS Elective", credits: 3 }
  ],
  [
    { code: "COMP SCI 439", name: "Intro Data & Info Sys", credits: 3 },
    { code: "COMP SCI 471", name: "Intro to AI", credits: 3 },
    { code: "NAT SCI", name: "Natural Science Breadth", credits: 3 },
    { code: "LIT", name: "Literature Breadth", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 3 }
  ],
  [
    { code: "COMP SCI 642", name: "Intro Info Security", credits: 3 },
    { code: "CS APP", name: "CS Application Requirement", credits: 3 },
    { code: "SOC SCI", name: "Social Science Breadth", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 3 }
  ],
  [
    { code: "COMP SCI 564", name: "Database Mgmt Systems", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 3 },
    { code: "ELECT", name: "Elective", credits: 3 }
  ],
];

export default function FourYearPlan() {
  return (
    <div className="bg-white rounded-xl shadow p-6 w-full max-w-6xl min-w-[900px]">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
        4-Year Academic Plan
      </h2>
      {/* Use grid-cols-4 for a true 4-column layout */}
      <div className="grid grid-cols-4 gap-6">
        {YEARS.map((year, yIdx) => (
          <div key={year} className="border rounded p-4 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center tracking-tight">
              {year}
            </h3>
            {SEMESTERS.map((sem, sIdx) => {
              const semesterIdx = yIdx * 2 + sIdx;
              const courses = fourYearPlan[semesterIdx] || [];
              return (
                <div key={sem} className="mb-4">
                  <h4 className="text-blue-700 font-semibold">{sem}</h4>
                  <ul>
                    {courses.map((c, rIdx) => (
                      <li key={rIdx} className="text-gray-700">
                        {c.code}: {c.name}{" "}
                        <span className="text-gray-400">({c.credits} cr)</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-right text-sm text-gray-600">
                    Total: {courses.reduce((acc, c) => acc + (c.credits || 0), 0)} credits
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
