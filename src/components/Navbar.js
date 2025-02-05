import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
      <h1 className="text-lg font-bold">🏡 Real Estate Platform</h1>
      <div className="space-x-4">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/listings" className="hover:underline">Listings</Link>
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <Link href="/profile" className="hover:underline">Profile</Link>
      </div>
    </nav>
  );
}
