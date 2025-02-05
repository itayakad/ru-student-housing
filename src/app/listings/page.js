"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai"; // Import heart icons
import Link from "next/link";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [trackedListings, setTrackedListings] = useState(new Set());
  const user = auth.currentUser;

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "listings"));
        const listingsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchTrackedListings = async () => {
      const savedRef = collection(db, "users", user.uid, "savedListings");
      const savedSnap = await getDocs(savedRef);
      setTrackedListings(new Set(savedSnap.docs.map((doc) => doc.id)));
    };

    fetchTrackedListings();
  }, [user]);

  const handleTrackListing = async (listingId) => {
    if (!user) {
      alert("You must be logged in to track listings.");
      return;
    }

    const listingRef = doc(db, "users", user.uid, "savedListings", listingId);

    if (trackedListings.has(listingId)) {
      await deleteDoc(listingRef);
      setTrackedListings((prev) => new Set([...prev].filter((id) => id !== listingId)));
    } else {
      await setDoc(listingRef, { savedAt: new Date() });
      setTrackedListings((prev) => new Set(prev.add(listingId)));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Available Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="border p-4 rounded-lg shadow relative">
            <h2 className="text-xl font-bold">{listing.title}</h2>
            <p>{listing.description}</p>
            <p className="text-gray-500">Location: {listing.location}</p>
            <p className="font-bold">${listing.price}/month</p>

            {/* Track Listing Button (Heart Icon) */}
            <button
              onClick={() => handleTrackListing(listing.id)}
              className="absolute top-2 right-2 text-red-600 text-2xl"
            >
              {trackedListings.has(listing.id) ? <AiFillHeart /> : <AiOutlineHeart />}
            </button>

            <Link href={`/view-listing/${listing.id}`} className="block bg-blue-600 text-white text-center p-2 mt-2">
              View Listing
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
