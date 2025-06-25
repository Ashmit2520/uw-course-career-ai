import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="flex gap-6 p-4 bg-gray-800 text-white">
      <Link href="/" className="hover:text-blue-400">Home</Link>
      <Link href="/chat" className="hover:text-blue-400">Chatbot</Link>
      <Link href="/recommendations" className="hover:text-blue-400">Recommendations</Link>
      <Link href="/careers" className="hover:text-blue-400">Careers</Link>
    </nav>
  );
}
