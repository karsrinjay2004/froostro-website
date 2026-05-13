"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Script from "next/script";

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [cartItems, setCartItems] = useState([]);

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

  const addToCart = (dish) => {
    setCartItems((prev) => [...prev, dish]);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      );

      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
        }),
      });

      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "FROOSTRO",
        description: "Food Order Payment",
        order_id: order.id,

        handler: function () {
          alert("Payment successful!");
          setCartItems([]);
        },

        theme: {
          color: "#f97316",
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

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

          <div className="flex gap-3">
            <div className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold">
              Cart ({cartItems.length})
            </div>

            <button
              onClick={handleCheckout}
              className="bg-black text-white px-5 py-3 rounded-xl font-semibold"
            >
              Checkout
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold">
              Affordable Home Made & Restaurants Meals Delivered To Your Doorstep
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
                href="/seller/auth"
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
              Fresh Meals On Your Table
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
                        onClick={() => addToCart(dish)}
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

        {/* SUBSCRIPTION */}
        <section className="py-20 px-6 bg-orange-100">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-orange-600">
              Home Meal Subscription Plans
            </h2>

            <p className="text-gray-700 mt-4 max-w-3xl mx-auto">
              Choose flexible home-style meal subscriptions from verified Froostro sellers.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-14">
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Daily Plan</h3>
                <p className="mt-6 text-gray-600">
                  Perfect for fresh daily home meals.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Weekly Plan</h3>
                <p className="mt-6 text-gray-600">
                  Ideal for hassle-free weekly meal planning.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Monthly Plan</h3>
                <p className="mt-6 text-gray-600">
                  Best for affordable long-term subscriptions.
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
    </>
  );
}
    
                      