"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SellerDashboard() {
  const router = useRouter();

  const [sellerName, setSellerName] = useState("");
  const [sellerType, setSellerType] = useState("");

  const [dishName, setDishName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [mealCategory, setMealCategory] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [quantity, setQuantity] = useState("");

  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/seller/auth");
        return;
      }

      try {
        const sellerRef = doc(db, "sellers", user.uid);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          setSellerName(data.sellerName);
          setSellerType(data.sellerType);
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/seller/auth");
    } catch (error) {
      alert(error.message);
    }
  };

  const uploadToCloudinary = async () => {
    if (!imageFile) {
      throw new Error("Please select an image.");
    }

    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "froostro_dishes");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/djcpol3kh/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    setUploadingImage(false);

    if (!data.secure_url) {
      throw new Error("Image upload failed.");
    }

    return data.secure_url;
  };

  const handleAddDish = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const imageUrl = await uploadToCloudinary();

      await addDoc(collection(db, "dishes"), {
        sellerName,
        sellerType,
        dishName,
        price,
        imageUrl,
        description,
        mealCategory,
        subscriptionType,
        quantity,
        createdAt: new Date(),
      });

      alert("Dish added successfully!");

      setDishName("");
      setPrice("");
      setDescription("");
      setMealCategory("");
      setSubscriptionType("");
      setQuantity("");
      setImageFile(null);

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-12">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-2xl p-10">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-orange-600">
            Seller Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-xl font-semibold"
          >
            Logout
          </button>
        </div>

        <p className="text-center text-gray-600 mt-4">
          Add your dishes to Froostro
        </p>

        <div className="mt-6 bg-orange-100 p-4 rounded-xl">
          <p>
            <strong>Seller:</strong> {sellerName || "Loading..."}
          </p>
          <p>
            <strong>Type:</strong> {sellerType || "Loading..."}
          </p>
        </div>

        <form onSubmit={handleAddDish} className="mt-8 space-y-5">
          
          <input
            type="text"
            placeholder="Dish Name"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <input
            type="number"
            placeholder="Dish Price (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <input
            type="number"
            placeholder="Available Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

          <div className="w-full border p-4 rounded-xl bg-white">
            <label className="block font-semibold mb-3">
              Upload Dish Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              required
              className="w-full"
            />
          </div>

          <select
            value={mealCategory}
            onChange={(e) => setMealCategory(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          >
            <option value="">Select Meal Category</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
            <option value="Beverages">Beverages</option>
          </select>

          <select
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          >
            <option value="">Subscription Compatibility</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="All">All</option>
          </select>

          <textarea
            placeholder="Dish Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full border p-4 rounded-xl"
          />

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold"
          >
            {uploadingImage
              ? "Uploading Image..."
              : loading
              ? "Adding Dish..."
              : "Add Dish"}
          </button>
        </form>
      </div>
    </main>
  );
}