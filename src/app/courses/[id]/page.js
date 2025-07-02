"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/courses/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!course || course.error) return <div className="p-8 text-center">Course not found.</div>;

  return (
    <main className="flex flex-col items-center p-8">
      <div className="bg-white rounded-xl shadow p-8 max-w-xl w-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">{course.subject_name_section}</h1>
        <p className="text-lg text-gray-700 mb-4">{course.class_description}</p>
        <div className="grid grid-cols-2 gap-2 text-gray-600 mb-2">
          <span className="font-semibold">Department:</span>
          <span>{course.department}</span>
          <span className="font-semibold">College:</span>
          <span>{course.college}</span>
          <span className="font-semibold">Subject Code:</span>
          <span>{course.subject_code}</span>
          <span className="font-semibold">Average GPA:</span>
          <span>{course.ave_gpa ?? "N/A"}</span>
          <span className="font-semibold">Number of Grades:</span>
          <span>{course.num_grades ?? "N/A"}</span>
        </div>
        {/* Optional: Show full grade distribution */}
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-1">Grade Distribution</h2>
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-700">
            {["A", "AB", "B", "BC", "C", "D", "F", "S", "U", "CR", "N", "P", "I", "NW", "NR", "Other"].map((k) =>
              course[k] !== undefined && course[k] !== "NA" ? (
                <div key={k} className="flex justify-between">
                  <span>{k}:</span>
                  <span>{course[k]}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
