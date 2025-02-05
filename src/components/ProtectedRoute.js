"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ role, children }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login"); // Redirect to login if not authenticated
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);

        if (userData.role !== role) {
          // Redirect to the correct dashboard if the user is in the wrong place
          router.push(userData.role === "student" ? "/dashboard/student" : "/dashboard/landlord");
        }
      }

      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Loading...</p>;

  return userRole === role ? children : null;
}
