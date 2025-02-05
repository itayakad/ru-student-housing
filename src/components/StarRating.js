"use client";
import { useState, useEffect } from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";

export default function StarRating({ listingId }) {
  const [rating, setRating] = useState(0);
  const user = auth.currentUser;

  // Load user's existing rating
  useEffect(() => {
    if (!listingId) return; // Ensure listingId is defined before fetching
    
    const fetchRating = async () => {
      if (!user) return; // Ensure user is logged in
      
      try {
        const ratingsRef = collection(db, "listings", listingId, "ratings");
        const q = query(ratingsRef, where("userId", "==", auth.currentUser?.uid));
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
          setRating(querySnapshot.docs[0].data().rating);
        } else {
          setRating(0); // Default to 0 if no rating exists
        }
      } catch (error) {
        console.error("Error fetching rating:", error);
      }
    };

    fetchRating();
  }, [user, listingId]);

  const handleRating = async (newRating) => {
    if (!user) {
      alert("You must be logged in to rate this listing.");
      return;
    }

    try {
      // Check if the user already has a rating
      const q = query(collection(db, "listings", listingId, "ratings"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If rating exists, delete the old one
        await deleteDoc(doc(db, "listings", listingId, "ratings", querySnapshot.docs[0].id));
      }

      // Set new rating
      await setDoc(doc(db, "listings", listingId, "ratings", user.uid), {
        userId: user.uid,
        rating: newRating,
        createdAt: new Date(),
      });

      setRating(newRating);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRating(star)}
          className="text-yellow-500 text-3xl"
        >
          {star <= rating ? <AiFillStar /> : <AiOutlineStar />}
        </button>
      ))}
    </div>
  );
}
