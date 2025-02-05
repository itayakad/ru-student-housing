"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import Link from "next/link";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [savedListings, setSavedListings] = useState(new Set());
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    if (!currentUser) return;

    const fetchSavedListings = async () => {
      try {
        const savedRef = collection(db, "users", currentUser.uid, "savedListings");
        const savedSnap = await getDocs(savedRef);
        const savedListingIds = new Set(savedSnap.docs.map((doc) => doc.id));

        setSavedListings(savedListingIds);

        const listingData = [];
        for (const savedDoc of savedSnap.docs) {
          const listingRef = doc(db, "listings", savedDoc.id);
          const listingSnap = await getDoc(listingRef);

          if (listingSnap.exists()) {
            listingData.push({
              id: listingSnap.id,
              ...listingSnap.data(),
            });
          }
        }

        setListings(listingData);
      } catch (error) {
        console.error("Error fetching saved listings:", error);
      }
    };

    fetchSavedListings();
  }, []);

  const handleTrackListing = async (listingId) => {
    if (!user) {
      alert("You must be logged in to track listings.");
      return;
    }

    const listingRef = doc(db, "users", user.uid, "savedListings", listingId);

    if (savedListings.has(listingId)) {
      await deleteDoc(listingRef);
      setSavedListings((prev) => new Set([...prev].filter((id) => id !== listingId)));
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
    } else {
      await setDoc(listingRef, { savedAt: new Date() });
      setSavedListings((prev) => new Set(prev.add(listingId)));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p>Welcome, {user?.email}!</p>

      <h2 className="text-xl font-bold mt-6">Tracked Listings</h2>
      {listings.length === 0 ? (
        <p>No tracked listings yet.</p>
      ) : (
        listings.map((listing) => (
          <div key={listing.id} className="border p-4 rounded-lg shadow mt-4">
            {/* Title and Heart in a Row */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{listing.title}</h2>
              <button onClick={() => handleTrackListing(listing.id)} className="text-red-600 text-2xl">
                {savedListings.has(listing.id) ? <AiFillHeart /> : <AiOutlineHeart />}
              </button>
            </div>

            {/* Listing Details */}
            <p>{listing.description}</p>
            <p className="text-gray-500">Location: {listing.location}</p>
            <p className="font-bold">${listing.price}/month</p>

            {/* View Listing Button */}
            <Link href={`/view-listing/${listing.id}`} className="block bg-blue-600 text-white text-center p-2 mt-2 rounded-md hover:bg-blue-700 transition">
              View Listing
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
