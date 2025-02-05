import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-8 py-4 flex justify-between items-center shadow-md">
      {/* Clickable Logo / Title */}
      <Link href="/" className="text-2xl font-bold flex items-center gap-2 hover:opacity-80 transition">
        🏡 <span className="hidden sm:inline">Rutgers Housing</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex space-x-6 text-lg">
        <Link href="/listings" className="hover:text-gray-300 transition">
          Listings
        </Link>
        <Link href="/dashboard" className="hover:text-gray-300 transition">
          Dashboard
        </Link>
        <Link href="/profile" className="hover:text-gray-300 transition">
          Profile
        </Link>
      </div>
    </nav>
  );
}
