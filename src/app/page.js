"use client";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#0f0f1a] text-[#E5E5E5] min-h-screen flex flex-col items-center">
      {/* Hero Section */}
      <section className="text-center py-24 px-4">
        <Image
          src="/Sift_AI_Logo.png"
          alt="SiftAI Logo"
          width={64}
          height={64}
          className="mx-auto mb-6 animate-pulse"
        />
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          SiftAI
        </h1>
        <p className="text-xl md:text-2xl mb-6 text-[#a0a0c0]">
          From Classrooms To Careers, SiftAI Has You Covered.
        </p>
        <Link
          href="/chat"
          className="inline-block px-8 py-3 bg-[#7f5af0] text-[#0f0f1a] font-semibold rounded-xl shadow-lg hover:bg-violet-600 transition"
        >
          Try the Chatbot
        </Link>
      </section>

      {/* How It Works */}
      <section className="w-full px-6 py-16 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center ">
          {[
            { emoji: "⌨️", title: "Ask a Question", desc: "Chat naturally about courses or careers." },
            { emoji: "🧠", title: "Get Smart Answers", desc: "AI suggests real courses or majors." },
            { emoji: "🎓", title: "Plan Your Path", desc: "Visualize a custom four-year roadmap." },
          ].map((item, i) => (
            <div key={i} className="bg-[#1c1f2b] p-6 rounded-lg border-2 border-theme shadow-md hover:shadow-xl transition">
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-[#a0a0c0]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
<section className="w-full px-6 py-16 bg-[#1a1d24] text-center text-white">
  <h2 className="text-3xl font-bold mb-10">Why SiftAI?</h2>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto ">
    {[
      {
        icon: "💖",
        title: "AI That Gets You",
        blurb: "Talk to an advisor that actually listens and gives smart, personalized advice.",
      },
      {
        icon: "✅",
        title: "Smart Course Matching",
        blurb: "Find the right classes for you based on your interests, goals, and learning style.",
      },
      {
        icon: "📈",
        title: "Career Insights",
        blurb: "Explore majors and careers with real salary data and job outlooks.",
      },
      {
        icon: "🧭",
        title: "4-Year Planning",
        blurb: "Visualize your academic journey with flexible semester-by-semester planning.",
      },
    ].map(({ icon, title, blurb }, i) => (
      <div
        key={i}
        className="bg-[#2a2d3a] p-6 rounded-lg shadow hover:shadow-xl transition  border-2 border-theme"
      >
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-300">{blurb}</p>
      </div>
    ))}
  </div>
</section>


      {/* Chat Preview Section */}
      <section className="px-4 py-20 text-center max-w-3xl">
        <h2 className="text-3xl font-bold mb-6">See It In Action</h2>
        <div className="bg-[#1e2230] text-left rounded-lg p-6 text-sm font-mono text-[#c9d1d9] shadow-lg">
          <p><span className="text-[#2cb67d]">User:</span> What are some interesting computer science courses?</p>
          <p className="mt-3"><span className="text-[#7f5af0]">SiftAI:</span> </p>
          <ul className="pl-4 list-disc text-[#9ca3af]">
            <li>CS 540 – Intro to AI: Explore search algorithms, ML, and NLP.</li>
            <li>CS 537 – Operating Systems: Learn memory, filesystems, processes.</li>
            <li>CS 400 – Backend Dev: Databases, APIs, and server-side logic.</li>
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-gradient-to-r from-[#7f5af0] to-[#a48fff] py-16 text-center">
        <h2 className="text-3xl font-bold text-[#0f1117] mb-4">
          Start your journey with SiftAI.
        </h2>
        <p className="text-[#0f1117] mb-6 text-lg">
          Smarter course and career decisions await.
        </p>
        <Link
          href="/chat"
          className="inline-block px-6 py-3 bg-[#0f1117] text-white rounded-lg shadow-lg hover:border transition"
        >
          Launch Chatbot 
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-xs text-gray-500 text-center py-6">
        Made with ❤️ for UW-Madison students — SiftAI, 2025.
      </footer>
    </main>
  );
}
