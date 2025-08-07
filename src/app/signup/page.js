'use client';
import { useState } from "react";
import Link from "next/link";

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await res.json();
    if (res.ok) {
      setSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-theme-card shadow rounded-xl p-8 w-full max-w-sm border border-grey-200">
        <h2 className="text-3xl text-white font-bold mb-4 text-center">Sign Up</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            className="px-4 py-2 text-grey-300 rounded border border-white focus:outline-none focus:ring placeholder-gray-700"
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="px-4 py-2 text-grey-300 rounded border border-white focus:outline-none focus:ring placeholder-gray-700"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="px-4 py-2 text-grey-300 rounded border border-white focus:outline-none focus:ring placeholder-gray-700"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>
        {success && <div className="text-green-600 mt-2 text-center">Account created!</div>}
        {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
        <div className="text-sm text-white text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
