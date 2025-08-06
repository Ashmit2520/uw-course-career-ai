// src/app/careers/page.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CareersPage() {
  const [query, setQuery] = useState("");
  const [careers, setCareers] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchCareers("");
  }, []);

  const fetchCareers = async (searchString) => {
    const res = await fetch(`/api/careers?q=${encodeURIComponent(searchString)}`);
    setCareers(await res.json());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
    fetchCareers(searchInput);
  };

  return (
    <main className="flex flex-col items-center p-8 min-h-screen bg-[#0f0f1a] text-white">
      <h1 className="text-3xl font-bold mb-4 text-center">Explore Career Paths</h1>
      <form
        className="w-full max-w-md flex mb-8 border border-theme"
        onSubmit={handleSearch}
        autoComplete="off"
      >
        {/*Search bar*/}
        <input
          className="w-full px-4 py-2 rounded-l border border-theme bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Search careers..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-theme-primary rounded-r flex items-center justify-center hover:bg-primary/90 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
            <line x1="16" y1="16" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </form>

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
              Early Career Salary: ${career.early_career_salary.toLocaleString()}<br/>
              Mid Career Salary: ${career.mid_career_salary.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
