"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

export default function ViewListing() {
  const { id } = useParams(); // Get listing ID from URL
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0); // For image carousel
  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const listingRef = doc(db, "listings", id);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
        } else {
          console.error("Listing not found");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkTracked = async () => {
      if (!user) return;
      const savedRef = doc(db, "users", user.uid, "savedListings", id);
      const savedSnap = await getDoc(savedRef);
      setTracked(savedSnap.exists());
    };

    fetchListing();
    checkTracked();
  }, [id, user]);

  const handleTrackListing = async () => {
    if (!user) {
      alert("You must be logged in to track listings.");
      return;
    }

    const listingRef = doc(db, "users", user.uid, "savedListings", id);

    if (tracked) {
      await deleteDoc(listingRef);
      setTracked(false);
    } else {
      await setDoc(listingRef, { savedAt: new Date() });
      setTracked(true);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading listing...</p>;
  if (!listing) return <p className="text-center text-red-500">Listing not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">{listing.title}</h1>
        {/* Track Listing Button (Heart Icon) */}
        <button onClick={handleTrackListing} className="text-red-600 text-3xl">
          {tracked ? <AiFillHeart /> : <AiOutlineHeart />}
        </button>
      </div>

      {/* Image Carousel */}
      {listing.images?.length > 0 ? (
        <div className="relative w-full h-64 overflow-hidden mt-4">
          <img
            src={listing.images[currentImage]}
            alt="Listing Image"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            onClick={() => setCurrentImage((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
          >
            ◀
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
          >
            ▶
          </button>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No images available for this listing.</p>
      )}

      <p className="text-lg mt-4">{listing.description}</p>
      <p className="text-gray-500">Location: {listing.location}</p>
      <p className="font-bold text-xl">${listing.price}/month</p>
    </div>
  );
}
