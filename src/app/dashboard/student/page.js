"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    if (!currentUser) return;

    const fetchSavedListings = async () => {
      try {
        const savedRef = collection(db, "users", currentUser.uid, "savedListings");
        const savedSnap = await getDocs(savedRef);
        const savedData = [];

        for (const savedDoc of savedSnap.docs) {
          const listingRef = doc(db, "listings", savedDoc.id);
          const listingSnap = await getDoc(listingRef);

          if (listingSnap.exists()) {
            savedData.push({
              id: listingSnap.id,
              ...listingSnap.data(),
            });
          }
        }

        setSavedListings(savedData);
      } catch (error) {
        console.error("Error fetching saved listings:", error);
      }
    };

    fetchSavedListings();
  }, []);

  const handleUnsaveListing = async (listingId) => {
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "savedListings", listingId));
    setSavedListings((prev) => prev.filter((listing) => listing.id !== listingId));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p>Welcome, {user?.email}!</p>

      <h2 className="text-xl font-bold mt-6">Tracked Listings</h2>
      {savedListings.length === 0 ? (
        <p>No tracked listings yet.</p>
      ) : (
        savedListings.map((listing) => (
          <div key={listing.id} className="border p-4 rounded-lg shadow mt-4">
            <h2 className="text-lg font-bold">{listing.title}</h2>
            <p>{listing.description}</p>
            <p className="text-gray-500">Location: {listing.location}</p>
            <p className="font-bold">${listing.price}/month</p>
            <button onClick={() => handleUnsaveListing(listing.id)} className="bg-red-600 text-white p-2 mt-2">
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}
