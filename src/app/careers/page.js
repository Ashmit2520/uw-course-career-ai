export default function CareersPage() {
  return (
    <main className="flex flex-col items-center min-h-[80vh] px-4">
      <h2 className="text-3xl font-bold mb-4 mt-8">Career Path Suggestions</h2>
      <p className="mb-2 text-gray-600">Explore careers based on your courses and interests.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        {/* Placeholder cards */}
        <div className="bg-white border rounded-xl shadow p-6 text-gray-400">[CareerCard Placeholder 1]</div>
        <div className="bg-white border rounded-xl shadow p-6 text-gray-400">[CareerCard Placeholder 2]</div>
      </div>
    </main>
  );
}
