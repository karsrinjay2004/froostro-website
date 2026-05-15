"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Script from "next/script";

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [distance, setDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [foodTotal, setFoodTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
    if (cartItems.length > 0) {
      const existingSeller = cartItems[0].sellerName;

      if (dish.sellerName !== existingSeller) {
        alert(
          "You can order from only one seller at a time. Please clear your cart first."
        );
        return;
      }
    }

    setCartItems((prev) => [...prev, dish]);
  };

  const removeFromCart = (dish) => {
    const index = cartItems.findIndex((item) => item.id === dish.id);

    if (index === -1) return;

    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);

    setCartItems(updatedCart);
  };

  const getDishQuantity = (dish) => {
    return cartItems.filter((item) => item.id === dish.id).length;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateDeliveryCharge = (km) => {
    if (km <= 1) {
      return 48;
    }

    return Math.ceil(48 + (km - 1) * 12);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty!");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setCheckoutLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customerLat = position.coords.latitude;
        const customerLng = position.coords.longitude;

        const sellerLat = cartItems[0].latitude;
        const sellerLng = cartItems[0].longitude;

        if (
          sellerLat === undefined ||
          sellerLng === undefined ||
          sellerLat === null ||
          sellerLng === null
        ) {
          alert(
            "Seller location unavailable. Please re-add dishes uploaded after seller location update."
          );
          setCheckoutLoading(false);
          return;
        }

        const km = calculateDistance(
          customerLat,
          customerLng,
          sellerLat,
          sellerLng
        );

        // NEW BUSINESS RULE
        if (km > 10) {
          alert(
            "Sorry! we couldn't deliver your order as we deliver orders Upto 10kms!!!"
          );
          setCheckoutLoading(false);
          return;
        }

        const delivery = calculateDeliveryCharge(km);

        const totalFood = cartItems.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );

        setDistance(km.toFixed(2));
        setDeliveryCharge(delivery);
        setFoodTotal(totalFood);
        setGrandTotal(totalFood + delivery);
        setCheckoutOpen(true);
        setCheckoutLoading(false);
      },
      () => {
        alert("Please allow location access to continue.");
        setCheckoutLoading(false);
      }
    );
  };

  const proceedToPayment = async () => {
    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: grandTotal,
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
          const groupedItems = {};

          cartItems.forEach((item) => {
            if (groupedItems[item.dishName]) {
              groupedItems[item.dishName].quantity += 1;
            } else {
              groupedItems[item.dishName] = {
                quantity: 1,
              };
            }
          });

          let itemMessage = "";

          Object.keys(groupedItems).forEach((dishName) => {
            itemMessage += `${dishName} x ${groupedItems[dishName].quantity}%0A`;
          });

          const whatsappMessage =
            `Welcome To Froostro!%0A%0A` +
            `New Paid Order Received%0A%0A` +
            `Items:%0A${itemMessage}%0A` +
            `Food Total: ₹${foodTotal}%0A` +
            `Delivery Charge: ₹${deliveryCharge}%0A` +
            `Grand Total Paid: ₹${grandTotal}`;

          window.open(
            `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`,
            "_blank"
          );

          alert("Payment successful!");

          setCartItems([]);
          setCheckoutOpen(false);
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

      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-orange-600 text-center">
              Checkout Summary
            </h2>

            <div className="mt-6 space-y-3 text-lg">
              <p><strong>Food Total:</strong> ₹{foodTotal}</p>
              <p><strong>Distance:</strong> {distance} km</p>
              <p><strong>Delivery Charge:</strong> ₹{deliveryCharge}</p>
              <p><strong>Grand Total:</strong> ₹{grandTotal}</p>
            </div>

            {deliveryCharge > 50 && (
              <p className="mt-5 text-sm text-red-600 bg-red-50 p-4 rounded-xl">
                Please Don't think you are paying extra, the delivery charges
                will be going to our logistics partner Porter as we currently
                don't have our own logistics, but we will make it as soon as
                possible.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-1/2 bg-gray-300 py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={proceedToPayment}
                className="w-1/2 bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-orange-50 text-black">
        <nav className="sticky top-0 z-50 bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Froostro" className="w-12 h-12 rounded-full" />
            <h1 className="text-3xl font-bold text-orange-600">FROOSTRO</h1>
          </div>

          <div className="flex gap-3">
            <div className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold">
              Cart ({cartItems.length})
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="bg-black text-white px-5 py-3 rounded-xl font-semibold"
            >
              {checkoutLoading ? "Calculating..." : "Checkout"}
            </button>
          </div>
        </nav>

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

                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-full shadow-lg px-3 py-2">
                        <button
                          onClick={() => removeFromCart(dish)}
                          className="bg-red-500 text-white w-10 h-10 rounded-full text-2xl font-bold flex items-center justify-center"
                        >
                          -
                        </button>

                        <span className="text-lg font-bold text-black min-w-[20px] text-center">
                          {getDishQuantity(dish)}
                        </span>

                        <button
                          onClick={() => addToCart(dish)}
                          className="bg-orange-500 text-white w-10 h-10 rounded-full text-2xl font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-bold">{dish.dishName}</h3>
                      <p className="text-gray-600 mt-2">{dish.description}</p>
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

        <section className="py-20 px-6 bg-orange-100">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-orange-600">
              Home Meal Subscription Plans
            </h2>

            <p className="text-gray-700 mt-4 max-w-3xl mx-auto">
              Choose flexible home-style meal subscriptions from verified
              Froostro sellers.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-14">
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Daily Plan</h3>
                <p className="mt-6 text-gray-600">Perfect for fresh daily home meals.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Weekly Plan</h3>
                <p className="mt-6 text-gray-600">Ideal for hassle-free weekly meal planning.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <h3 className="text-2xl font-bold text-orange-600">Monthly Plan</h3>
                <p className="mt-6 text-gray-600">Best for affordable long-term subscriptions.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-black text-white py-8 text-center">
          <p>© 2026 Froostro. All Rights Reserved.</p>
        </footer>
      </main>
    </>
  );
}
    