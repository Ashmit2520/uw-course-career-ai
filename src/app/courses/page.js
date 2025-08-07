"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

const PAGE_SIZE = 18;

const SORT_OPTIONS = [
  { value: "course_name", label: "Course Name (A-Z)" },
  { value: "avg_gpa", label: "Average GPA (high to low)", direction: "desc" },
  { value: "students", label: "Enrollment (high to low)", direction: "desc" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Sorting
  const [sort, setSort] = useState("students");
  const [direction, setDirection] = useState("desc");

  const inputRef = useRef(null);

  // Fetch courses
  useEffect(() => {
    setLoading(true);
    let url = `/api/courses?page=${page}&pageSize=${PAGE_SIZE}&sort=${sort}&direction=${direction}`;
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
  }, [search, page, sort, direction]);

  // Handle search on button click or Enter key
  const doSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setSearch(query);
    inputRef.current?.blur();
  };

  // Truncate description helper
  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  // Total pages
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-center">All Courses</h1>

      {/* SORT + SEARCH ROW */}
      <div className="w-full md:w-3/4 flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        {/* Search bar */}
        <form className="flex flex-1" onSubmit={doSearch} autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            className="flex-grow border rounded-l-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder="Search by course name, code, or department..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-theme-primary hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg flex items-center justify-center"
            aria-label="Search"
          >
            <FiSearch size={22} />
          </button>
        </form>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-white font-medium">
            Sort by:
          </label>
          <select
            id="sort"
            className="border rounded px-2 py-1 bg-[#0f0f1a] text-white font-semibold shadow focus:ring border border-gray-100"
            value={sort}
            onChange={e => {
              const selected = SORT_OPTIONS.find(o => o.value === e.target.value);
              setSort(selected.value);
              setDirection(selected.direction || "asc");
              setPage(1);
            }}
            style={{ minWidth: 185 }}
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

      {/* LOADING / ERROR STATES */}
      {loading && <div>Loading...</div>}
      {!loading && courses.length === 0 && <div>No courses found.</div>}

      {/* COURSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${encodeURIComponent(course.id)}`}
            className="block"
          >
            <div className="border rounded-xl p-4 shadow bg-theme-card hover:-translate-y-1 hover:shadow-xl transition-transform duration-200 min-h-[190px] flex flex-col justify-between">
              <h2 className="font-semibold text-lg text-white mb-1">{course.course_name}</h2>
              <div className="text-[#a0a0c0] mb-2" style={{ minHeight: 48 }}>
                {truncate(course.description || "", 110)}
              </div>
              <div className="text-sm text-[#a0a0c0] mt-auto">
                <span>{course.subject_name}</span> | <span>GPA: {course.avg_gpa ?? "N/A"}</span> | <span>Enrolled: {course.students}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-8 items-center">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-[#a0a0c0] disabled:opacity-40"
          >Prev</button>
          <span className="font-medium text-[#a0a0c0] ">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border text-[#a0a0c0]  disabled:opacity-40"
          >Next</button>
        </div>
      )}
    </main>
  );
}
