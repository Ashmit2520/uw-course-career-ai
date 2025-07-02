'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const pages = [
    { name: 'Home', href: '/' },
    { name: 'Chatbot', href: '/chat' },
    { name: 'Courses', href: '/courses' },
    { name: 'Recommendations', href: '/recommendations' },
    { name: 'Careers', href: '/careers' },
    { name: 'Sign Up', href: '/signup' },
    { name: 'Log In', href: '/login' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow flex items-center justify-between px-4 md:px-12 h-16">
      {/* Logo and Site Name */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="h-8 w-8 min-w-8 min-h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold group-hover:brightness-90 transition"></div>
        <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition">
          Course Selector
        </span>
      </Link>
      {/* Desktop Nav */}
      <div className="hidden md:flex gap-6 items-center">
        {pages.map((page) => {
          const isActive = pathname === page.href;
          return (
            <Link
              key={page.name}
              href={page.href}
              className={
                `transition font-medium px-2 py-1 rounded 
                ${isActive
                  ? 'text-blue-600 font-bold bg-blue-100'
                  : 'text-gray-700 hover:text-blue-600'}`
              }
              aria-current={isActive ? 'page' : undefined}
            >
              {page.name}
            </Link>
          );
        })}
      </div>
      {/* Hamburger Menu for Mobile */}
      <div className="md:hidden flex items-center">
        <button
          className="text-gray-700 hover:text-blue-600 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute top-16 right-4 w-44 bg-white rounded shadow-md flex flex-col py-2 animate-fade-in z-50">
            {pages.map((page) => {
              const isActive = pathname === page.href;
              return (
                <Link
                  key={page.name}
                  href={page.href}
                  className={
                    `px-4 py-2 rounded transition font-medium 
                    ${isActive
                      ? 'text-blue-600 bg-blue-100 font-bold'
                      : 'text-gray-700 hover:text-blue-600'}`
                  }
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {page.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
