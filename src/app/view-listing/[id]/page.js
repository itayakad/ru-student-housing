"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { AiOutlineHeart, AiFillHeart, AiOutlineLike, AiFillLike } from "react-icons/ai";
import StarRating from "@/components/StarRating";

export default function ViewListing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const user = auth.currentUser;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ Moved fetchComments to the top so it is accessible everywhere
  const fetchComments = async () => {
    try {
      const q = query(collection(db, "listings", id, "comments"));
      const querySnapshot = await getDocs(q);
  
      const allComments = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const commentData = docSnap.data();
        const commentId = docSnap.id;
  
        // ✅ Get like count for this comment
        const likesSnapshot = await getDocs(collection(db, "listings", id, "comments", commentId, "likes"));
        commentData.likes = likesSnapshot.size; // Total number of likes
  
        // ✅ Check if the logged-in user has liked this comment
        const userLikeRef = doc(db, "listings", id, "comments", commentId, "likes", user?.uid || "anonymous");
        const userLikeSnap = await getDoc(userLikeRef);
        commentData.likedByUser = userLikeSnap.exists(); // True if user liked
  
        return { id: commentId, ...commentData };
      }));
  
      setComments(allComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };  

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

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
  
    try {
      await deleteDoc(doc(db, "listings", id, "comments", commentId));
  
      // Remove the deleted comment from the state immediately
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };  

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const listingRef = doc(db, "listings", id);
        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAverageRating = async () => {
      try {
        const ratingsRef = collection(db, "listings", id, "ratings");
        const querySnapshot = await getDocs(ratingsRef);

        if (!querySnapshot.empty) {
          const totalRating = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
          setAverageRating((totalRating / querySnapshot.docs.length).toFixed(1));
          setRatingCount(querySnapshot.docs.length);
        }
      } catch (error) {
        console.error("Error calculating average rating:", error);
      }
    };

    const checkTracked = async () => {
      if (!user) return;
      const savedRef = doc(db, "users", user.uid, "savedListings", id);
      const savedSnap = await getDoc(savedRef);
      setTracked(savedSnap.exists());
    };

    fetchListing();
    fetchComments(); // ✅ Now fetchComments is accessible here
    fetchAverageRating();
    checkTracked();
  }, [id, user]);

  const handleSubmitComment = async () => {
    if (!user) {
      alert("You must be logged in to comment.");
      return;
    }

    try {
      await addDoc(collection(db, "listings", id, "comments"), {
        userId: user.uid,
        text: comment,
        createdAt: new Date(),
      });

      setComment("");
      fetchComments(); // ✅ Now fetchComments is accessible here
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleLikeToggle = async (commentId) => {
    if (!user) {
      alert("You must be logged in to like a comment.");
      return;
    }
  
    try {
      const likeRef = doc(db, "listings", id, "comments", commentId, "likes", user.uid);
      const likeSnap = await getDoc(likeRef);
  
      let updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          if (likeSnap.exists()) {
            // User is unliking the comment
            return { ...comment, likes: comment.likes - 1, likedByUser: false };
          } else {
            // User is liking the comment
            return { ...comment, likes: comment.likes + 1, likedByUser: true };
          }
        }
        return comment;
      });
  
      setComments(updatedComments); // Update UI immediately
  
      if (likeSnap.exists()) {
        await deleteDoc(likeRef); // Remove like
      } else {
        await setDoc(likeRef, { likedAt: new Date() }); // Add like
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };  

  if (loading) return <p>Loading listing...</p>;
  if (!listing) return <p>Listing not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">{listing.title}</h1>
        <button onClick={handleTrackListing} className="text-red-600 text-3xl">
          {tracked ? <AiFillHeart /> : <AiOutlineHeart />}
        </button>
      </div>

      {/* Star Rating & Count */}
      <p className="text-lg mt-2">
        ⭐ {averageRating} / 5 ({ratingCount} ratings)
      </p>
      <StarRating listingId={id} rating={rating} setRating={setRating} />

      {/* Image Carousel */}
      {listing.images?.length > 0 ? (
        <div className="relative w-full h-64 overflow-hidden mt-4">
          {/* Display current image */}
          <img
            src={listing.images[currentImage]}
            alt="Listing Image"
            className="w-full h-full object-cover rounded-md"
          />

          {/* Previous Image Button */}
          {listing.images.length > 1 && (
            <button
              onClick={() => setCurrentImage((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
            >
              ◀
            </button>
          )}

          {/* Next Image Button */}
          {listing.images.length > 1 && (
            <button
              onClick={() => setCurrentImage((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
            >
              ▶
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No images available for this listing.</p>
      )}

      <p className="text-lg mt-4">{listing.description}</p>
      <p className="text-gray-500">Location: {listing.location}</p>
      <p className="font-bold text-xl">${listing.price}/month</p>

      {/* Comment Section */}
      <h2 className="text-xl font-bold mt-6">Leave a Comment</h2>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a review..."
        className="border p-2 w-full mt-2"
      />
      <button onClick={handleSubmitComment} className="bg-blue-600 text-white p-2 mt-2">
        Submit
      </button>

      {/* Display Comments */}
      {comments.map((comment) => (
        <div key={comment.id} className="border p-4 rounded-lg shadow mt-4">
          <p>{comment.text}</p>
          <p className="text-sm text-gray-500">
            Posted on {new Date(comment.createdAt?.seconds * 1000).toLocaleDateString()}
          </p>

          {/* Like Button */}
          <button onClick={() => handleLikeToggle(comment.id)} className="flex items-center space-x-2">
            {comment.likedByUser ? (
              <AiFillLike className="text-blue-500" />
            ) : (
              <AiOutlineLike className="text-gray-500" />
            )}
            <span className="text-gray-700">{comment.likes}</span>
          </button>

          {/* Delete Button - Only shows if the user is the comment's author */}
          {comment.userId === user?.uid && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-red-500 ml-4"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
