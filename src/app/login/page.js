import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white shadow rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-3xl text-black font-bold mb-4 text-center">Log In</h2>
        <form className="flex flex-col gap-4">
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
            Log In
          </button>
        </form>
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
