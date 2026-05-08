"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";

export default function SellerDashboard() {
  const [sellerName, setSellerName] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [dishName, setDishName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [mealCategory, setMealCategory] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

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
  };

  const handleAddDish = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

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
      setImageUrl("");
      setDescription("");
      setMealCategory("");
      setSubscriptionType("");
      setQuantity("");

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-12">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-2xl p-10">

        <h1 className="text-3xl font-bold text-center text-orange-600">
          Seller Dashboard
        </h1>

        <p className="text-center text-gray-600 mt-2">
          Add your dishes to Froostro
        </p>

        <div className="mt-6 bg-orange-100 p-4 rounded-xl">
          <p><strong>Seller:</strong> {sellerName || "Loading..."}</p>
          <p><strong>Type:</strong>  {sellerType || "Loading..."}</p>
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

          <input
            type="text"
            placeholder="Dish Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
            className="w-full border p-4 rounded-xl"
          />

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
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold"
          >
            {loading ? "Adding Dish..." : "Add Dish"}
          </button>

        </form>
      </div>
    </main>
  );
}