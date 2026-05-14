"use client";

import { useState } from "react";
import { auth, db, googleProvider } from "../../../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SellerAuth() {
  const [isNewSeller, setIsNewSeller] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const sellerRef = doc(db, "sellers", user.uid);
      const sellerSnap = await getDoc(sellerRef);

      if (sellerSnap.exists()) {
        router.push("/seller/dashboard");
      } else {
        setSellerName(user.displayName || "");
        setIsNewSeller(true);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationCaptured(true);
        alert("Business location captured successfully!");
      },
      (error) => {
        alert("Unable to fetch location. Please allow location access.");
      }
    );
  };

  const completeSignup = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Authentication failed");
        return;
      }

      if (!locationCaptured) {
        alert("Please capture your business location first.");
        return;
      }

      await setDoc(doc(db, "sellers", user.uid), {
        sellerName,
        sellerType,
        businessName,
        email: user.email,
        latitude,
        longitude,
        createdAt: new Date(),
      });

      alert("Seller signup successful!");
      router.push("/seller/dashboard");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center px-6 py-12">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-xl">

        <h1 className="text-3xl font-bold text-center text-orange-600">
          Seller Authentication
        </h1>

        <p className="text-center text-gray-600 mt-3">
          Login or signup with Google
        </p>

        {!isNewSeller && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl mt-8 font-semibold"
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        )}

        {isNewSeller && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full border p-4 rounded-xl mt-8"
            />

            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value)}
              className="w-full border p-4 rounded-xl mt-6"
            >
              <option value="">Select Seller Type</option>
              <option value="Home Cook">Home Cook</option>
              <option value="Restaurant">Restaurant</option>
            </select>

            <input
              type="text"
              placeholder="Business / Kitchen Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border p-4 rounded-xl mt-6"
            />

            <button
              onClick={captureLocation}
              className="w-full bg-blue-600 text-white py-4 rounded-xl mt-6 font-semibold"
            >
              {locationCaptured
                ? "Location Captured ✅"
                : "Use Current Kitchen Location"}
            </button>

            <button
              onClick={completeSignup}
              className="w-full bg-green-600 text-white py-4 rounded-xl mt-6 font-semibold"
            >
              Complete Signup
            </button>
          </>
        )}

      </div>
    </main>
  );
}
       