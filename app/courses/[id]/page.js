"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const GRADE_KEYS = [
  "A", "AB", "B", "BC", "C", "D", "F", "S", "U", "CR", "N", "P", "I", "NW", "NR", "Other"
];

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
  if (!course || course.error)
    return <div className="p-8 text-center">Course not found.</div>;

  // Prepare grade data for the bar chart
  const chartData = GRADE_KEYS
    .map((k) =>
      course[k] !== undefined && course[k] !== "NA"
        ? { grade: k, value: Number(course[k]) }
        : null
    )
    .filter((d) => d && !isNaN(d.value));

  return (
    <main className="flex flex-col items-center p-8">
      <div className="bg-white rounded-xl shadow p-8 max-w-xl w-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          {course.subject_name_section}
        </h1>
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
        <div className="mt-6">
          <h2 className="font-extrabold text-lg mb-2 text-black">
            Grade Distribution
          </h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="grade"
                  label={{
                    value: "Grade",
                    position: "insideBottom",
                    offset: -4,
                    fill: "#374151", // Tailwind gray-700
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  label={{
                    value: "Percentage of students",
                    angle: -90,
                    position: "outsideLeft", // <--- move label outside
                    offset: 35,
                    fill: "#374151",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
