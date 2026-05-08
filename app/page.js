"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const whatsappNumber = "918822780887";

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "dishes"));

      const dishList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDishes(dishList);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-orange-50 text-black">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Froostro"
            className="w-12 h-12 rounded-full"
          />

          <h1 className="text-3xl font-bold text-orange-600">
            FROOSTRO
          </h1>
        </div>

        <div className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold">
          Cart ({cartCount})
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold">
            Affordable Home-Style Meals Delivered Daily
          </h1>

          <p className="mt-6 text-xl max-w-3xl mx-auto">
            Discover delicious meals from home cooks and restaurants near you.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Welcome%20To%20Froostro!!%20Please%20share%20your%20item%20details%20with%20the%20quantity%20that%20you%20want%20to%20place%20an%20order.`}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
            >
              Order on WhatsApp
            </a>

            <a
              href="/seller/signup"
              className="border border-white px-6 py-3 rounded-xl font-semibold"
            >
              Become a Seller
            </a>
          </div>
        </div>
      </section>

      {/* DISHES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-orange-600">
            Fresh Meals Available
          </h2>

          <p className="text-center text-gray-600 mt-4">
            Meals uploaded directly by Froostro sellers
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-14">
            {dishes.length > 0 ? (
              dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={dish.imageUrl}
                      alt={dish.dishName}
                      className="w-full h-64 object-cover"
                    />

                    <button
                      onClick={addToCart}
                      className="absolute bottom-4 left-4 bg-orange-500 text-white w-14 h-14 rounded-full text-3xl font-bold flex items-center justify-center shadow-lg"
                    >
                      +
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold">
                      {dish.dishName}
                    </h3>

                    <p className="text-gray-600 mt-2">
                      {dish.description}
                    </p>

                    <p className="text-2xl font-bold mt-4 text-orange-600">
                      ₹{dish.price}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-3">
                No dishes uploaded yet.
              </p>
            )}
          </div>
        </div>
      </section>
      {/* SUBSCRIPTION PLANS */}
<section className="py-20 px-6 bg-orange-100">
  <div className="max-w-6xl mx-auto text-center">

    <h2 className="text-4xl font-bold text-orange-600">
      Home Meal Subscription Plans
    </h2>

    <p className="text-gray-700 mt-4 max-w-3xl mx-auto">
      Choose flexible home-style meal subscriptions from verified Froostro sellers.
      Pricing will appear once sellers onboard and publish their plans.
    </p>

    <div className="grid md:grid-cols-3 gap-8 mt-14">

      {/* DAILY */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border">
        <h3 className="text-2xl font-bold text-orange-600">
          Daily Plan
        </h3>

        <p className="mt-6 text-gray-600">
          Perfect for customers who want fresh home-style meals every day with full flexibility.
        </p>

        <button className="mt-8 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          View Available Sellers
        </button>
      </div>

      {/* WEEKLY */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border">
        <h3 className="text-2xl font-bold text-orange-600">
          Weekly Plan
        </h3>

        <p className="mt-6 text-gray-600">
          Ideal for students and professionals who prefer hassle-free weekly meal planning.
        </p>

        <button className="mt-8 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          View Available Sellers
        </button>
      </div>

      {/* MONTHLY */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border">
        <h3 className="text-2xl font-bold text-orange-600">
          Monthly Plan
        </h3>

        <p className="mt-6 text-gray-600">
          Best suited for long-term affordable meal subscriptions with trusted home cooks.
        </p>

        <button className="mt-8 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          View Available Sellers
        </button>
      </div>

    </div>
  </div>
</section>

      {/* WHY FROOSTRO */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-orange-600">
            Why Froostro?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-14">
            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Affordable Meals
              </h3>

              <p className="mt-4 text-gray-600">
                Better pricing than traditional delivery platforms.
              </p>
            </div>

            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Home-Style Food
              </h3>

              <p className="mt-4 text-gray-600">
                Healthy, comforting meals made with care.
              </p>
            </div>

            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Empower Sellers
              </h3>

              <p className="mt-4 text-gray-600">
                Home cooks and restaurants earn directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-8 text-center">
        <p>© 2026 Froostro. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
  