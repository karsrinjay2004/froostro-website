"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";

// ─── Time slots ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { id: "slot_1", label: "Breakfast", time: "7:00 AM – 9:00 AM",  emoji: "🌅" },
  { id: "slot_2", label: "Morning",   time: "10:00 AM – 12:00 PM", emoji: "☀️" },
  { id: "slot_3", label: "Lunch",     time: "12:00 PM – 2:00 PM",  emoji: "🍱" },
  { id: "slot_4", label: "Evening",   time: "4:00 PM – 6:00 PM",   emoji: "🌤️" },
  { id: "slot_5", label: "Dinner",    time: "7:00 PM – 9:00 PM",   emoji: "🌙" },
];

const todayStr = () => new Date().toISOString().split("T")[0];

const defaultAvailability = () => ({
  date: todayStr(),
  fullDayUnavailable: false,
  slots: Object.fromEntries(TIME_SLOTS.map((s) => [s.id, "available"])),
});

export default function SellerDashboard() {
  const router = useRouter();

  // ─── Seller info ─────────────────────────────────────────────────────────────
  const [sellerName, setSellerName]     = useState("");
  const [sellerType, setSellerType]     = useState("");
  const [sellerId, setSellerId]         = useState("");
  const [businessName, setBusinessName] = useState("");

  // ─── Dish form ───────────────────────────────────────────────────────────────
  const [dishName, setDishName]               = useState("");
  const [price, setPrice]                     = useState("");
  const [description, setDescription]         = useState("");
  const [mealCategory, setMealCategory]       = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [quantity, setQuantity]               = useState("");
  const [imageFile, setImageFile]             = useState(null);

  // ─── Location ────────────────────────────────────────────────────────────────
  const [sellerLatitude, setSellerLatitude]   = useState(null);
  const [sellerLongitude, setSellerLongitude] = useState(null);

  // ─── Availability ────────────────────────────────────────────────────────────
  const [availability, setAvailability]   = useState(defaultAvailability());
  const [availSaving, setAvailSaving]     = useState(false);
  const [availSaved, setAvailSaved]       = useState(false);
  const [showAvailSection, setShowAvailSection] = useState(false);

  // ─── UI states ───────────────────────────────────────────────────────────────
  const [loading, setLoading]             = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab]         = useState("dishes"); // "dishes" | "availability"

  // ─── Auth + load seller ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/seller/auth"); return; }

      try {
        const sellerRef  = doc(db, "sellers", user.uid);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          setSellerId(user.uid);
          setSellerName(data.sellerName);
          setSellerType(data.sellerType);
          setBusinessName(data.businessName || data.sellerName || "");

          // Load availability — reset if new day
          if (data.availability && data.availability.date === todayStr()) {
            setAvailability(data.availability);
          } else {
            setAvailability(defaultAvailability());
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ─── Save availability to Firestore ──────────────────────────────────────────
  const saveAvailability = async (updated) => {
    if (!sellerId) return;
    setAvailSaving(true);
    try {
      await setDoc(
        doc(db, "sellers", sellerId),
        { availability: updated },
        { merge: true }
      );
      setAvailSaved(true);
      setTimeout(() => setAvailSaved(false), 2000);
    } catch (err) {
      console.error("Availability save error:", err);
    }
    setAvailSaving(false);
  };

  // ─── Toggle full day ──────────────────────────────────────────────────────────
  const toggleFullDay = () => {
    const updated = {
      ...availability,
      date: todayStr(),
      fullDayUnavailable: !availability.fullDayUnavailable,
    };
    setAvailability(updated);
    saveAvailability(updated);
  };

  // ─── Toggle individual slot ───────────────────────────────────────────────────
  const toggleSlot = (slotId) => {
    if (availability.fullDayUnavailable) return;
    const updated = {
      ...availability,
      date: todayStr(),
      slots: {
        ...availability.slots,
        [slotId]:
          availability.slots[slotId] === "available"
            ? "unavailable"
            : "available",
      },
    };
    setAvailability(updated);
    saveAvailability(updated);
  };

  // ─── Location ────────────────────────────────────────────────────────────────
  const fetchSellerLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setSellerLatitude(position.coords.latitude);
      setSellerLongitude(position.coords.longitude);
      alert("Kitchen location captured successfully!");
    },
    (error) => {
      console.error(error);

      if (error.code === 1) {
        alert("Location permission denied. Please allow location access in Chrome.");
      } else if (error.code === 2) {
        alert("Location unavailable. Please turn on GPS and Google Location Accuracy.");
      } else if (error.code === 3) {
        alert("Location request timed out. Move outdoors and try again.");
      } else {
        alert("Unable to fetch location.");
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
};

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/seller/auth");
    } catch (error) {
      alert(error.message);
    }
  };

  // ─── Cloudinary upload ────────────────────────────────────────────────────────
  const uploadToCloudinary = async () => {
    if (!imageFile) throw new Error("Please select an image.");
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "froostro_dishes");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/djcpol3kh/image/upload",
      { method: "POST", body: formData }
    );
    const data = await response.json();
    setUploadingImage(false);

    if (!data.secure_url) throw new Error("Image upload failed.");
    return data.secure_url;
  };

  // ─── Add dish ────────────────────────────────────────────────────────────────
  const handleAddDish = async (e) => {
    e.preventDefault();
    try {
      if (!sellerLatitude || !sellerLongitude) {
        alert("Please capture your kitchen location first.");
        return;
      }
      setLoading(true);
      const imageUrl = await uploadToCloudinary();

      await addDoc(collection(db, "dishes"), {
        sellerId,
        sellerName,
        sellerType,
        businessName,
        dishName,
        price,
        imageUrl,
        description,
        mealCategory,
        subscriptionType,
        quantity,
        latitude: sellerLatitude,
        longitude: sellerLongitude,
        createdAt: new Date(),
      });

      alert("Dish added successfully!");
      setDishName(""); setPrice(""); setDescription("");
      setMealCategory(""); setSubscriptionType("");
      setQuantity(""); setImageFile(null);

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const isFullyUnavailable = availability.fullDayUnavailable;

  // ─── Available slot count ─────────────────────────────────────────────────────
  const availableCount = isFullyUnavailable
    ? 0
    : TIME_SLOTS.filter((s) => availability.slots[s.id] === "available").length;

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white shadow-2xl rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-orange-600">Seller Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-2 rounded-xl font-semibold"
            >
              Logout
            </button>
          </div>

          <div className="mt-4 bg-orange-100 p-4 rounded-xl space-y-1">
            <p><strong>Seller:</strong> {sellerName || "Loading..."}</p>
            <p><strong>Business:</strong> {businessName || "Loading..."}</p>
            <p><strong>Type:</strong> {sellerType || "Loading..."}</p>
          </div>
        </div>

        {/* ── Tab switcher ── */}
        <div className="bg-white shadow rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setActiveTab("dishes")}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              activeTab === "dishes"
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            🍱 Add Dishes
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            className={`flex-1 py-3 rounded-xl font-semibold transition relative ${
              activeTab === "availability"
                ? isFullyUnavailable
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            🕐 My Availability
            {/* Live status dot */}
            <span
              className={`absolute top-2 right-3 w-2.5 h-2.5 rounded-full ${
                isFullyUnavailable ? "bg-red-300" : "bg-green-300"
              } animate-pulse`}
            />
          </button>
        </div>

        {/* ════════════════════════════════════════
            TAB 1 — ADD DISHES
        ════════════════════════════════════════ */}
        {activeTab === "dishes" && (
          <div className="bg-white shadow-2xl rounded-2xl p-8">
            <p className="text-center text-gray-600 mb-6">
              Add your dishes to Froostro
            </p>

            <form onSubmit={handleAddDish} className="space-y-5">
              <input
                type="text"
                placeholder="Dish Name"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                required
                className="w-full border p-4 rounded-xl bg-white text-black placeholder-gray-500"
              />

              <input
                type="number"
                placeholder="Dish Price (₹)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full border p-4 rounded-xl bg-white text-black placeholder-gray-500"
              />

              <input
                type="number"
                placeholder="Available Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full border p-4 rounded-xl bg-white text-black placeholder-gray-500"
              />

              <div className="w-full border p-4 rounded-xl bg-white text-black">
                <label className="block font-semibold mb-3">
                  Upload Dish Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  required
                  className="w-full text-black"
                />
              </div>

              <button
                type="button"
                onClick={fetchSellerLocation}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold"
              >
                📍 Use Current Kitchen Location
                {sellerLatitude && (
                  <span className="ml-2 text-blue-200 text-sm">✅ Captured</span>
                )}
              </button>

              <select
                value={mealCategory}
                onChange={(e) => setMealCategory(e.target.value)}
                required
                className="w-full border p-4 rounded-xl bg-white text-black"
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
                className="w-full border p-4 rounded-xl bg-white text-black"
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
                className="w-full border p-4 rounded-xl bg-white text-black placeholder-gray-500"
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
        )}

        {/* ════════════════════════════════════════
            TAB 2 — AVAILABILITY
        ════════════════════════════════════════ */}
        {activeTab === "availability" && (
          <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Today's Availability
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Customers see this in real-time on Froostro
                </p>
              </div>
              <div className="flex items-center gap-2">
                {availSaving && (
                  <span className="text-orange-500 text-sm font-semibold">
                    Saving...
                  </span>
                )}
                {availSaved && (
                  <span className="text-green-600 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full">
                    ✅ Saved
                  </span>
                )}
              </div>
            </div>

            {/* Current status banner */}
            <div
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                isFullyUnavailable
                  ? "bg-red-50 border-2 border-red-300"
                  : "bg-green-50 border-2 border-green-300"
              }`}
            >
              <span className="text-3xl">
                {isFullyUnavailable ? "🔴" : "🟢"}
              </span>
              <div>
                <p className="font-bold text-gray-800 text-lg">
                  {isFullyUnavailable
                    ? "Your kitchen is CLOSED today"
                    : `Your kitchen is OPEN — ${availableCount} slot${availableCount !== 1 ? "s" : ""} active`}
                </p>
                <p className="text-sm text-gray-500">
                  {isFullyUnavailable
                    ? "Customers see \"Not Available Today\" on your card"
                    : "Customers can see and order from your kitchen"}
                </p>
              </div>
            </div>

            {/* Full Day Toggle */}
            <div
              onClick={toggleFullDay}
              className={`flex items-center justify-between p-5 rounded-xl cursor-pointer border-2 transition-all ${
                isFullyUnavailable
                  ? "bg-red-50 border-red-400"
                  : "bg-gray-50 border-gray-200 hover:border-orange-300"
              }`}
            >
              <div>
                <p className="font-bold text-gray-800">
                  {isFullyUnavailable
                    ? "❌ Mark as Available Today"
                    : "🔴 Mark as Unavailable Full Day"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isFullyUnavailable
                    ? "Tap to reopen your kitchen"
                    : "Use this if you cannot cook today at all"}
                </p>
              </div>
              <div
                className={`w-14 h-7 rounded-full flex items-center px-1 transition-all duration-300 ${
                  isFullyUnavailable ? "bg-red-400" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                    isFullyUnavailable ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-sm text-gray-400 font-semibold">
                OR MANAGE BY TIME SLOT
              </p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Time slots */}
            <div className="space-y-3">
              {TIME_SLOTS.map((slot) => {
                const isAvailable =
                  availability.slots[slot.id] === "available";
                const isBlocked   = isFullyUnavailable;

                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isBlocked
                        ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200"
                        : isAvailable
                        ? "bg-green-50 border-green-300 cursor-pointer hover:border-green-500"
                        : "bg-red-50 border-red-300 cursor-pointer hover:border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{slot.emoji}</span>
                      <div>
                        <p className="font-bold text-gray-800">{slot.label}</p>
                        <p className="text-sm text-gray-500">{slot.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>
                      <div
                        className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all duration-300 ${
                          isAvailable ? "bg-green-400" : "bg-red-400"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                            isAvailable ? "translate-x-0" : "translate-x-6"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* What customers see summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-bold text-orange-700 mb-2">
                📱 Live preview — what customers see on Froostro right now:
              </p>
              {isFullyUnavailable ? (
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ❌ Not Available Today
                  </span>
                  <span className="text-xs text-gray-500">
                    shown on your seller card
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.filter(
                    (s) => availability.slots[s.id] === "available"
                  ).map((s) => (
                    <span
                      key={s.id}
                      className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full"
                    >
                      {s.emoji} {s.label}
                    </span>
                  ))}
                  {availableCount === 0 && (
                    <span className="text-xs text-red-500">
                      All slots off — customers see you as unavailable
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
