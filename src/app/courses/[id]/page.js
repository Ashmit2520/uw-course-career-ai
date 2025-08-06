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
  "grade_a",
  "grade_ab",
  "grade_b",
  "grade_bc",
  "grade_c",
  "grade_d",
  "grade_f",
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
  const chartData = GRADE_KEYS.map((k) =>
    course[k] !== undefined && course[k] !== "NA"
      ? {
          grade: k.replace("grade_", "").toUpperCase(),
          value: Number(course[k]),
        }
      : null
  ).filter((d) => d && !isNaN(d.value));

  return (
    <main className="flex flex-col items-center p-8">
      <div className="bg-white rounded-xl shadow p-8 max-w-xl w-full ">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          {course.course_name}
        </h1>
        <p className="text-lg text-gray-700 mb-4">{course.description}</p>
        <div className="grid grid-cols-2 gap-2 text-gray-600 mb-2">
          <span className="font-semibold">Subject:</span>
          <span>{course.subject_name}</span>
          <span className="font-semibold">Average GPA:</span>
          <span>{course.avg_gpa ?? "N/A"}</span>
          <span className="font-semibold">Students:</span>
          <span>{course.students ?? "N/A"}</span>
          <span className="font-semibold">Prerequisites:</span>
          <span>{course.prerequisites || "None"}</span>
        </div>
        <div className="mt-6">
          <h2 className="font-extrabold text-lg mb-2 text-black">
            Grade Distribution
          </h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="grade"
                  label={{
                    value: "Grade",
                    position: "insideBottom",
                    dy: 10,
                    fill: "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  label={{
                    value: "Number of Students",
                    angle: -90,
                    position: "insideLeft",
                    dy: 60,
                    dx: 15,
                    fill: "#374151",
                    fontSize: 14,
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
