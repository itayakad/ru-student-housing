"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const [role, setRole] = useState(null);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }

    const fetchUserRole = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);
        if (userData.role === "student") {
          router.push("/dashboard/student");
        } else if (userData.role === "landlord") {
          router.push("/dashboard/landlord");
        }
      }
    };

    fetchUserRole();
  }, [user]);

  return <p>Loading...</p>;
}
