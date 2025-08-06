// src/app/careers/[major]/page.js
import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import Database from "better-sqlite3";
import { Bar } from "@/components/ui/BarChart"; // You can customize or replace this with another chart lib

const dbPath = path.join(process.cwd(), "courses.db");

export async function generateStaticParams() {
  const db = new Database(dbPath);
  const rows = db.prepare("SELECT major FROM career_stats").all();
  return rows.map((row) => ({ major: encodeURIComponent(row.major) }));
}

export default async function CareerDetailPage({ params }) {
  const db = new Database(dbPath);
  const major = decodeURIComponent(params.major);
  const data = db.prepare("SELECT * FROM career_stats WHERE major = ?").get(major);
  if (!data) notFound();

  const demographicData = [
    { label: "Female", value: data.female_grads },
    { label: "Male", value: data.male_grads },
    { label: "Hispanic", value: data.hispanic_grads },
    { label: "Black", value: data.black_grads },
    { label: "Native American", value: data.native_american_grads },
    { label: "Asian", value: data.asian_grads },
    { label: "Pacific Islander", value: data.pacific_islander_grads },
    { label: "White", value: data.white_grads },
    { label: "Multiracial", value: data.multiracial_grads },
    { label: "Unknown", value: data.unknown_grads },
    { label: "International", value: data.intl_grads }
  ];

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white p-8">
      <h1 className="text-4xl font-bold mb-4">{data.major}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <p><span className="font-semibold">Unemployment Rate:</span> {data.unemployment_rate}%</p>
          <p><span className="font-semibold">Underemployment Rate:</span> {data.underemployment_rate}%</p>
          <p><span className="font-semibold">Graduate Degree Share:</span> {data.grad_degree_share}%</p>
          <p><span className="font-semibold">Early Career Salary:</span> ${data.early_career_salary.toLocaleString()}</p>
          <p><span className="font-semibold">Mid Career Salary:</span> ${data.mid_career_salary.toLocaleString()}</p>
        </div>

        <div className="bg-[#1f2333] p-4 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Demographic Breakdown</h2>
          <Bar data={demographicData} />
        </div>
      </div>
    </main>
  );
}
