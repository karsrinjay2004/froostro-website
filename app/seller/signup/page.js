"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";

export default function SellerSignup() {
  const [sellerName, setSellerName] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "sellers", userCredential.user.uid), {
        sellerName,
        sellerType,
        email,
        createdAt: new Date(),
      });

      alert("Seller account created successfully!");

      router.push("/seller/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-orange-50 px-6">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-orange-600">
          Seller Signup
        </h1>

        <p className="text-center text-gray-600 mt-2">
          Join Froostro as a Home Cook or Restaurant Seller
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <input
            type="text"
            placeholder="Seller Name"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <select
            value={sellerType}
            onChange={(e) => setSellerType(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          >
            <option value="">Select Seller Type</option>
            <option value="Home Cook">Home Cook</option>
            <option value="Restaurant">Restaurant</option>
          </select>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold"
          >
            {loading ? "Creating Account..." : "Create Seller Account"}
          </button>
        </form>
      </div>
    </main>
  );
}