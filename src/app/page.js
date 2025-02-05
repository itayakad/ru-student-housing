import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
        Welcome to Rutgers Housing
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Find the best rental listings for students.
      </p>
      <Link href="/listings" passHref>
        <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
          Browse Listings
        </button>
      </Link>
    </div>
  );
}
