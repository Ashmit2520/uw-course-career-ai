import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white shadow rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-3xl text-black font-bold mb-4 text-center">Sign Up</h2>
        <form className="flex flex-col gap-4">
          <input
            className="px-4 py-2 text-black rounded border focus:outline-none focus:ring placeholder-gray-700"
            type="text"
            placeholder="Name"
            required
          />
          <input
            className="px-4 py-2 text-black rounded border focus:outline-none focus:ring placeholder-gray-700"
            type="email"
            placeholder="Email"
            required
          />
          <input
            className="px-4 py-2 text-black rounded border focus:outline-none focus:ring placeholder-gray-700"
            type="password"
            placeholder="Password"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>
        <div className="text-sm text-black text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
