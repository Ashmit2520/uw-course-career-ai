"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/app/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage(error.message);
    else {
      setMessage("Logged in! You can now access your account.");
      // Optional: router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white shadow rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-3xl text-black font-bold mb-4 text-center">Log In</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="px-4 py-2 text-black rounded border focus:outline-none focus:ring placeholder-gray-700"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="px-4 py-2 text-black rounded border focus:outline-none focus:ring placeholder-gray-700"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        {message && (
          <div className="mt-3 text-center text-sm text-black">{message}</div>
        )}
        <div className="text-sm text-black text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
