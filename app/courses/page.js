"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // Fetch from API every time the search query changes
  useEffect(() => {
    setLoading(true);
    let url = "/api/courses";
    if (search.trim()) {
      // Encode search query for URL
      url += `?search=${encodeURIComponent(search.trim())}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  // Handle search on button click or Enter key
  const doSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(query);
    inputRef.current?.blur();
  };

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
            key={course.subject_name_section}
            href={`/courses/${encodeURIComponent(course.subject_name_section)}`}
            className="block"
          >
            <div className="border rounded-xl p-4 shadow bg-white hover:-translate-y-1 hover:shadow-xl transition-transform duration-200">
              <h2 className="font-semibold text-lg text-gray-900 mb-2">{course.subject_name_section}</h2>
              <p className="mb-1 text-gray-700">{course.class_description}</p>
              <div className="text-sm text-gray-500">
                <span>{course.department}</span> | <span>GPA: {course.ave_gpa ?? "N/A"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
