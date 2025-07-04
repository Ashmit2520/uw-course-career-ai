"use client";
import { useState, useEffect } from "react";

export default function CareersPage() {
  const [query, setQuery] = useState("");          // The string to search
  const [majors, setMajors] = useState([]);        // The array of careers/majors
  const [searchInput, setSearchInput] = useState(""); // What's typed in the input

  // Fetch all majors on page load
  useEffect(() => {
    fetchMajors(""); // Show all majors on load
  }, []);

  const fetchMajors = async (searchString) => {
    const res = await fetch(`/api/majors?q=${encodeURIComponent(searchString)}`);
    setMajors(await res.json());
  };

  // Only search when button or Enter is pressed
  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
    fetchMajors(searchInput);
  };

  return (
    <main className="flex flex-col items-center p-8 min-h-screen bg-black text-black">
      <h1 className="text-3xl font-bold mb-4 text-center text-white">
        Career Path Suggestions
      </h1>
      {/* Search bar */}
      <form
        className="w-full max-w-md flex mb-8"
        onSubmit={handleSearch}
        autoComplete="off"
      >
        <input
          className="w-full px-4 py-2 rounded-l border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Search by major..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 rounded-r flex items-center justify-center hover:bg-blue-700 transition"
        >
          {/* White SVG magnifying glass */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
            <line x1="16" y1="16" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </form>
      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {majors.length === 0 && (
          <div className="col-span-full text-gray-500 text-center">No majors found.</div>
        )}
        {majors.map((major, idx) => (
          <div
            key={idx}
            className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold mb-1 text-black">{major.major}</h2>
            <div className="text-gray-700 mb-2">
              <span className="font-semibold">Starting Median Salary: </span>${Number(major.starting_median_salary).toLocaleString()}
            </div>
            <div className="text-gray-700 mb-2">
              <span className="font-semibold">Mid-Career Median Salary: </span>${Number(major.mid_career_median_salary).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
