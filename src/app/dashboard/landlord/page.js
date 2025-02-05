"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getStorage, ref, uploadBytes, getDownloadURL ,deleteObject } from "firebase/storage";


export default function LandlordDashboard() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [images, setImages] = useState([]); // Store image files
  const router = useRouter();
  const storage = getStorage();
  const fileInputRef = useRef(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Ensure user authentication state is properly tracked
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      if (!loggedInUser) {
        router.push("/login"); // Redirect if not logged in
      } else {
        setUser(loggedInUser);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Fetch landlord's listings from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchListings = async () => {
      try {
        const q = query(collection(db, "listings"), where("landlordId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setListings(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching landlord listings:", error);
      }
    };

    fetchListings();
  }, [user]);

  const handleImageUpload = async (listingId) => {
    const imageUrls = [];
  
    for (let i = 0; i < images.length; i++) {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(images[i].type)) {
        console.error("Invalid file type:", images[i].name);
        continue; // Skip invalid file
      }
  
      const imageRef = ref(storage, `listing-images/${user.uid}/${listingId}/${images[i].name}`);
      await uploadBytes(imageRef, images[i]);
      const imageUrl = await getDownloadURL(imageRef);
      imageUrls.push(imageUrl);
    }
  
    return imageUrls;
  };  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !location || !price || images.length === 0) {
      setError("All fields and at least one image are required.");
      return;
    }

    try {
      if (!user) {
        setError("You must be logged in to create a listing.");
        return;
      }

      const listingRef = await addDoc(collection(db, "listings"), {
        title,
        description,
        location,
        price,
        landlordId: user.uid, // Save landlord ID
        landlordEmail: user.email, // Save landlord email
        createdAt: new Date(),
      });

      // Upload images and get their URLs
      const imageUrls = await handleImageUpload(listingRef.id);

      // Update Firestore document with images
      await updateDoc(doc(db, "listings", listingRef.id), {
        images: imageUrls,
      });

      setTitle("");
      setDescription("");
      setLocation("");
      setPrice("");
      setUploadSuccess(true); // Mark upload as successful
      setTimeout(() => {
        setImages([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setUploadSuccess(false); // Reset success state
      }, 10); // Short delay to ensure the UI updates properly
      setError("");

      const fetchListings = async () => {
        try {
          const q = query(collection(db, "listings"), where("landlordId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          setListings(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching landlord listings:", error);
        }
      };
      
      fetchListings(); // Fetch updated listings after adding a new one
      
    } catch (err) {
      console.error("Error creating listing:", err);
      setError("Failed to create listing. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      // Get the listing document
      const listingRef = doc(db, "listings", id);
      const listingSnap = await getDoc(listingRef);
  
      if (!listingSnap.exists()) {
        console.error("Listing not found.");
        return;
      }
  
      const listingData = listingSnap.data();
      const imageUrls = listingData.images || [];
  
      // Delete all images from Firebase Storage
      for (const imageUrl of imageUrls) {
        const imagePath = imageUrl.split(`${storage.app.options.storageBucket}/o/`)[1]?.split("?")[0]; // Extract correct path
        const decodedPath = decodeURIComponent(imagePath); // Decode URL encoding
        const imageRef = ref(storage, decodedPath);
        await deleteObject(imageRef).catch((error) => console.error("Error deleting image:", error));
      }
  
      // Delete the listing from Firestore
      await deleteDoc(listingRef);
  
      // Update UI state
      setListings((prevListings) => prevListings.filter((listing) => listing.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };  

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Landlord Dashboard</h1>

      {/* Create Listing Form */}
      <h2 className="text-xl font-bold mt-6">Create a New Listing</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Listing Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" />
        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="border p-2 w-full" />
        <input type="number" placeholder="Price (per month)" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full" />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => {
            if (!e.target.files.length) return; // Prevent empty selection
          
            setUploadSuccess(false); // Reset success flag when new files are added
          
            const validImages = [...e.target.files].filter((file) =>
              ["image/png", "image/jpeg", "image/jpg"].includes(file.type)
            );
          
            if (validImages.length !== e.target.files.length) {
              alert("Only JPG, JPEG, and PNG files are allowed.");
            }
          
            setImages(validImages);
          }}          
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 w-full">Create Listing</button>
      </form>

      {/* View My Listings */}
      <h2 className="text-xl font-bold mt-6">My Listings</h2>
      {listings.length === 0 ? <p>No listings found.</p> : listings.map((listing) => (
        <div key={listing.id} className="border p-4 rounded-lg shadow mt-4">
          <h2 className="text-lg font-bold">{listing.title}</h2>
          <p>{listing.description}</p>
          <p className="text-gray-500">Location: {listing.location}</p>
          <p className="font-bold">${listing.price}/month</p>

          <div className="flex space-x-2 mt-2">
            {/* View Listing Button */}
            <button 
              onClick={() => router.push(`/view-listing/${listing.id}`)} 
              className="bg-blue-500 text-white p-2 rounded"
            >
              View Listing
            </button>

            {/* Delete Listing Button */}
            <button 
              onClick={() => handleDelete(listing.id)} 
              className="bg-red-600 text-white p-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
