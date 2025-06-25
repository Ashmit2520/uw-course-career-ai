import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">UW-Madison Smart Course Selector</h1>
      <p className="text-lg md:text-xl mb-8 text-gray-700 text-center max-w-xl">Find the perfect courses for you—powered by AI.</p>
      <a
        href="/chat"
        className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
      >
        Get Started
      </a>
    </main>
  );
}
