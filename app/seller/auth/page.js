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
  const [isNewSeller, setIsNewSeller]         = useState(false);
  const [sellerName, setSellerName]           = useState("");
  const [sellerType, setSellerType]           = useState("");
  const [businessName, setBusinessName]       = useState("");
  const [latitude, setLatitude]               = useState(null);
  const [longitude, setLongitude]             = useState(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [loading, setLoading]                 = useState(false);

  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result  = await signInWithPopup(auth, googleProvider);
      const user    = result.user;
      const sellerRef  = doc(db, "sellers", user.uid);
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
      () => {
        alert("Unable to fetch location. Please allow location access.");
      }
    );
  };

  const completeSignup = async () => {
    try {
      const user = auth.currentUser;

      if (!user) { alert("Authentication failed"); return; }

      // ── Validation — every field must be filled ─────────────────────────────
      if (!sellerName.trim()) {
        alert("Please enter your full name.");
        return;
      }
      if (!sellerType || sellerType.trim() === "") {
        alert("Please select your seller type — Home Cook or Restaurant.");
        return;
      }
      if (!businessName.trim()) {
        alert("Please enter your business or kitchen name.");
        return;
      }
      if (!locationCaptured) {
        alert("Please capture your business location first.");
        return;
      }
      // ────────────────────────────────────────────────────────────────────────

      await setDoc(doc(db, "sellers", user.uid), {
        sellerName:   sellerName.trim(),
        sellerType:   sellerType.trim(),   // ← never blank now
        businessName: businessName.trim(), // ← never blank now
        email:        user.email,
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
            {/* Progress indicator */}
            <div className="mt-6 bg-orange-50 rounded-xl p-4 text-sm text-orange-700 font-semibold text-center">
              Complete all fields below to finish signup
            </div>

            {/* Full Name */}
            <input
              type="text"
              placeholder="Full Name *"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full border p-4 rounded-xl mt-6 bg-white text-black placeholder-gray-500"
            />

            {/* Seller Type — required */}
            <select
              value={sellerType}
              onChange={(e) => setSellerType(e.target.value)}
              className={`w-full border p-4 rounded-xl mt-4 bg-white text-black ${
                sellerType === "" ? "text-gray-500" : "text-black"
              }`}
            >
              <option value="">Select Seller Type *</option>
              <option value="Home Cook">🏠 Home Cook</option>
              <option value="Restaurant">🍽️ Restaurant</option>
            </select>

            {/* Business / Kitchen Name — required */}
            <input
              type="text"
              placeholder="Business / Kitchen Name *"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border p-4 rounded-xl mt-4 bg-white text-black placeholder-gray-500"
            />

            {/* Location */}
            <button
              onClick={captureLocation}
              className={`w-full py-4 rounded-xl mt-4 font-semibold text-white ${
                locationCaptured ? "bg-green-600" : "bg-blue-600"
              }`}
            >
              {locationCaptured
                ? "📍 Location Captured ✅"
                : "📍 Use Current Kitchen Location *"}
            </button>

            {/* Validation summary — show what's missing */}
            {(!sellerName.trim() ||
              !sellerType ||
              !businessName.trim() ||
              !locationCaptured) && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                <p className="text-sm font-bold text-red-700 mb-2">
                  Please complete:
                </p>
                {!sellerName.trim() && (
                  <p className="text-xs text-red-600">❌ Full Name</p>
                )}
                {(!sellerType || sellerType.trim() === "") && (
                  <p className="text-xs text-red-600">❌ Seller Type</p>
                )}
                {!businessName.trim() && (
                  <p className="text-xs text-red-600">❌ Business / Kitchen Name</p>
                )}
                {!locationCaptured && (
                  <p className="text-xs text-red-600">❌ Kitchen Location</p>
                )}
              </div>
            )}

            {/* Complete Signup — only fully active when all filled */}
            <button
              onClick={completeSignup}
              disabled={
                !sellerName.trim() ||
                !sellerType ||
                !businessName.trim() ||
                !locationCaptured
              }
              className={`w-full py-4 rounded-xl mt-6 font-semibold text-white transition ${
                !sellerName.trim() ||
                !sellerType ||
                !businessName.trim() ||
                !locationCaptured
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {!sellerName.trim() ||
              !sellerType ||
              !businessName.trim() ||
              !locationCaptured
                ? "Complete all fields to continue"
                : "✅ Complete Signup"}
            </button>
          </>
        )}

      </div>
    </main>
  );
}
       