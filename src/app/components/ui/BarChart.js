// src/app/components/ui/BarChart.js
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DemographicBarChart({ data }) {
  return (
    <div className="w-full h-[400px] pb-12"> {/* ← add bottom padding */}
      <ResponsiveContainer width="100%" height="120%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }} // ← more bottom margin
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            angle={-30} // ← tilt labels for better spacing
            textAnchor="end"
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
