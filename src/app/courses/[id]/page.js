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
  "grade_a", "grade_ab", "grade_b", "grade_bc",
  "grade_c", "grade_d", "grade_f"
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

  if (loading) return <div className="p-8 text-center text-[#a0a0c0]">Loading...</div>;
  if (!course || course.error)
    return <div className="p-8 text-center text-[#a0a0c0]">Course not found.</div>;

  // Prepare grade data for the bar chart
  const chartData = GRADE_KEYS
    .map((k) =>
      course[k] !== undefined && course[k] !== "NA"
        ? { grade: k.replace("grade_", "").toUpperCase(), value: Number(course[k]) }
        : null
    )
    .filter((d) => d && !isNaN(d.value));

  return (
    <main className="flex flex-col items-center p-8">
      <div className="bg-theme-card rounded-xl shadow p-8 max-w-xl w-full border-2 border-gray-200">
        <h1 className="text-2xl font-bold mb-2 text-white">
          {course.course_name}
        </h1>
        <p className="text-lg text-[#a0a0c0] mb-4">{course.description}</p>
        <div className="grid grid-cols-2 gap-2 text-gray-600 mb-2">
          <span className="font-semibold text-[#a0a0c0]">Subject:</span>
          <span className="text-[#a0a0c0]">{course.subject_name}</span>
          <span className="font-semibold text-[#a0a0c0]">Average GPA:</span>
          <span className="text-[#a0a0c0]">{course.avg_gpa ?? "N/A"}</span>
          <span className="font-semibold text-[#a0a0c0]">Students:</span>
          <span className="text-[#a0a0c0]">{course.students ?? "N/A"}</span>
          <span className="font-semibold text-[#a0a0c0]">Prerequisites:</span>
          <span className="text-[#a0a0c0]">{course.prerequisites || "None"}</span>
        </div>
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2 text-white">
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
                    fill: "#a0a0c0",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  tick={{ fill: "#a0a0c0" }}
                />
                <YAxis
                  label={{
                    value: "Number of Students",
                    angle: -90,
                    position: "outsideLeft",
                    offset: 50,
                    dx: -30,
                    fill: "#a0a0c0",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  tick={{ fill: "#a0a0c0" }}
                />
                <Tooltip 
                labelStyle={{ color: '#a78bfa' }} // Styles the "Grade" label
                />
                <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
