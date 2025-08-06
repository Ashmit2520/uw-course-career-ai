import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col bg-slate-950 items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">SiftAI</h1>
      <p className="text-lg md:text-xl mb-8 text-gray-400 text-center max-w-xl">Find the perfect courses for you - powered by AI.</p>
      <a
        href="/chat"
        className="px-8 py-3 bg-violet-400 text-slate-950 rounded-xl shadow hover:bg-violet-500 transition"
      >
        Get Started
      </a>
    </main>
  );
}
