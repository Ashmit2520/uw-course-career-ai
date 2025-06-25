import { useParams } from 'next/navigation';

export default function CourseDetailsPage() {
  const { id } = useParams();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-3xl font-bold mb-4">Course Details</h2>
      <p className="mb-2 text-gray-600">Details and reviews for course:</p>
      <div className="mt-4 p-6 bg-gray-100 rounded shadow w-full max-w-xl">
        <span className="text-gray-800 font-semibold">Course ID: {id}</span>
        <div className="mt-4 text-gray-400">[Course info placeholder]</div>
      </div>
    </div>
  );
}
