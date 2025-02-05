"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>

      {user ? (
        // Show user info if logged in
        <>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleLogout} className="bg-red-600 text-white p-2 mt-4">
            Log Out
          </button>
        </>
      ) : (
        // Show sign-up and login buttons if NOT logged in
        <>
          <p>You are not logged in.</p>
          <div className="space-x-4 mt-4">
            <button onClick={() => router.push("/login")} className="bg-blue-600 text-white p-2">
              Log In
            </button>
            <button onClick={() => router.push("/signup")} className="bg-green-600 text-white p-2">
              Sign Up
            </button>
          </div>
        </>
      )}
    </div>
  );
}
