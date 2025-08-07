"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const SORT_OPTIONS = [
  { value: "early", label: "Early Career Salary (high to low)", key: "early_career_salary" },
  { value: "mid", label: "Mid Career Salary (high to low)", key: "mid_career_salary" },
];

export default function CareersPage() {
  const [query, setQuery] = useState("");
  const [careers, setCareers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] = useState("early"); // default

  useEffect(() => {
    fetchCareers("");
  }, [sortOption]);

  const fetchCareers = async (searchString) => {
    const res = await fetch(`/api/careers?q=${encodeURIComponent(searchString)}`);
    const data = await res.json();

    // Sort on client side
    const sortKey = SORT_OPTIONS.find(opt => opt.value === sortOption).key;
    const sorted = data.sort((a, b) => b[sortKey] - a[sortKey]);

    setCareers(sorted);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
    fetchCareers(searchInput);
  };

  return (
    <main className="flex flex-col items-center p-8 min-h-screen bg-[#0f0f1a] text-white">
      <h1 className="text-3xl font-bold mb-4 text-center">Explore Career Paths</h1>

      {/* Search + Sort */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <form
          className="flex flex-1 border border-theme"
          onSubmit={handleSearch}
          autoComplete="off"
        >
          <input
            className="w-full px-4 py-2 rounded-l border-rounded-r border-gray-200 bg-theme-background text-[#a0a0c0] focus:outline-none focus:ring-2"
            type="text"
            placeholder="Search careers..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="w-15 h-10 bg-theme-primary rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
              <line x1="16" y1="16" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-white font-medium">Sort by:</label>
          <select
            id="sort"
            className=" rounded px-2 py-1 bg-[#0f0f1a] text-white font-semibold shadow focus:ring border border-gray-100"
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            style={{ minWidth: 240 }}
          >
            {SORT_OPTIONS.map(opt => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-gray-900 text-white font-semibold"
                style={{ backgroundColor: "#111827", color: "#fff" }}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Career cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {careers.length === 0 && (
          <div className="col-span-full text-gray-500 text-center">No results found.</div>
        )}
        {careers.map((career, idx) => (
          <Link
            href={`/careers/${encodeURIComponent(career.major)}`}
            key={idx}
            className="block bg-theme-card rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold mb-2 text-white">{career.major}</h2>
            <p className="text-sm text-gray-400">
              Early Career Salary: ${career.early_career_salary.toLocaleString()}<br />
              Mid Career Salary: ${career.mid_career_salary.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
