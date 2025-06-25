import { useParams } from 'next/navigation';

export default function CourseDetailsPage() {
  const { id } = useParams();

  return (
    <main className="flex flex-col items-center min-h-[80vh] px-4">
      <h2 className="text-3xl font-bold mb-4 mt-8">Course Details</h2>
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-8">
        <div className="text-gray-800 font-semibold mb-2 text-xl">Course ID: {id}</div>
        <div className="mt-4 text-gray-400">[Course info placeholder]</div>
      </div>
    </main>
  );
}
