"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

// Helper to truncate descriptions
function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}

const PAGE_SIZE = 18; // or 24 if you want

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    let url = `/api/courses?page=${page}&pageSize=${PAGE_SIZE}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.courses || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, page]);

  // Handle search on button click or Enter key
  const doSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1); // Reset to first page on new search
    setSearch(query);
    inputRef.current?.blur();
  };

  const numPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-center">All Courses</h1>
      <form
        className="mb-8 w-full md:w-1/2 flex"
        onSubmit={doSearch}
        autoComplete="off"
      >
        <input
          ref={inputRef}
          type="text"
          className="flex-grow border rounded-l-lg px-4 py-2 shadow-sm focus:ring focus:ring-blue-200"
          placeholder="Search by course name, code, or department..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg flex items-center justify-center"
          aria-label="Search"
        >
          <FiSearch size={22} />
        </button>
      </form>
      {loading && <div>Loading...</div>}
      {!loading && courses.length === 0 && <div>No courses found.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${encodeURIComponent(course.id)}`}
            className="block"
          >
            <div
              className="border rounded-xl p-4 shadow bg-white hover:-translate-y-1 hover:shadow-xl transition-transform duration-200 flex flex-col h-full"
              style={{ minHeight: 210 }}
            >
              <h2 className="font-semibold text-lg text-gray-900 mb-2">{course.course_name}</h2>
              <p className="mb-1 text-gray-700" style={{ minHeight: 56 }}>
                {truncate(course.description, 120)}
              </p>
              <div className="text-sm text-gray-500 mt-auto">
                <span>{course.subject_name}</span> | <span>GPA: {course.avg_gpa ?? "N/A"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex gap-2 mt-8 items-center">
        <button
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {page} of {numPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
          disabled={page === numPages}
        >
          Next
        </button>
      </div>
    </main>
  );
}
