"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Script from "next/script";

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [distance, setDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [perDeliveryCharge, setPerDeliveryCharge] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(1);
  const [foodTotal, setFoodTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeSellerType, setActiveSellerType] = useState("Home Cook");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [activeSubscriptionType, setActiveSubscriptionType] = useState("Daily");
  const [cartSubscriptionType, setCartSubscriptionType] = useState("Daily");

  const whatsappNumber = "918822780887";
  const currencySymbol = "\u20B9";

  // ─── Load Firestore ──────────────────────────────────────────────────────────
  // Real-time listeners: fires on page load AND whenever a seller adds/updates
  // a dish from their dashboard — homepage always stays in sync automatically.
  useEffect(() => {
    const unsubDishes = onSnapshot(
      collection(db, "dishes"),
      (snapshot) => {
        setDishes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("dishes listener error:", error)
    );

    const unsubSellers = onSnapshot(
      collection(db, "sellers"),
      (snapshot) => {
        setSellers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error("sellers listener error:", error)
    );

    return () => {
      unsubDishes();
      unsubSellers();
    };
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const normalizeText = (value) => String(value || "").trim().toLowerCase();

  const getSellerDisplayName = (seller) =>
    seller.businessName ||
    seller.kitchenName ||
    seller.restaurantName ||
    seller.sellerName ||
    "Froostro Seller";

  // ─── Options ─────────────────────────────────────────────────────────────────
  const sellerOptions = [
    { label: "🏠 Home Cooks", value: "Home Cook" },
    { label: "🍽️ Restaurants", value: "Restaurant" },
  ];

  const subscriptionOptions = [
    { label: "Daily",   value: "Daily",   emoji: "☀️" },
    { label: "Weekly",  value: "Weekly",  emoji: "📅" },
    { label: "Monthly", value: "Monthly", emoji: "🗓️" },
  ];

  // ─── Build seller cards ───────────────────────────────────────────────────────
  const sellerCards = useMemo(() => {
    const sellerMap = new Map();

    sellers.forEach((seller) => {
      const type = seller.sellerType || "Home Cook";
      const key = seller.id || `${type}-${seller.sellerName}`;
      sellerMap.set(key, {
        ...seller,
        id: key,
        sellerType: type,
        displayName: getSellerDisplayName(seller),
        source: "seller-profile",
      });
    });

    dishes.forEach((dish) => {
      const type = dish.sellerType || "Home Cook";
      const fallbackKey =
        dish.sellerId ||
        `${type}-${dish.businessName || dish.kitchenName || dish.sellerName}`;
      if (!sellerMap.has(fallbackKey)) {
        sellerMap.set(fallbackKey, {
          id: fallbackKey,
          sellerId: dish.sellerId,
          sellerName: dish.sellerName,
          sellerType: type,
          businessName: dish.businessName || dish.kitchenName || dish.sellerName,
          displayName:
            dish.businessName || dish.kitchenName || dish.sellerName || "Froostro Seller",
          source: "dish-fallback",
        });
      }
    });

    return Array.from(sellerMap.values());
  }, [dishes, sellers]);

  const filteredSellers = sellerCards.filter(
    (seller) => normalizeText(seller.sellerType) === normalizeText(activeSellerType)
  );

  // ─── Dish ↔ Seller matching ───────────────────────────────────────────────────
  const dishMatchesSeller = (dish, seller) => {
    const sameType =
      normalizeText(dish.sellerType || "Home Cook") === normalizeText(seller.sellerType || "Home Cook");
    const sameSellerId =
      seller.id && dish.sellerId &&
      normalizeText(dish.sellerId) === normalizeText(seller.id);
    const sameFallbackSellerId =
      seller.sellerId && dish.sellerId &&
      normalizeText(dish.sellerId) === normalizeText(seller.sellerId);
    const sameBusinessName =
      getSellerDisplayName(seller) &&
      (dish.businessName || dish.kitchenName) &&
      normalizeText(dish.businessName || dish.kitchenName) ===
        normalizeText(getSellerDisplayName(seller));
    const sameSellerName =
      seller.sellerName && dish.sellerName &&
      normalizeText(dish.sellerName) === normalizeText(seller.sellerName);
    return (
      sameType &&
      (sameSellerId || sameFallbackSellerId || sameBusinessName || sameSellerName)
    );
  };

  const sellerDishCount = (seller) =>
    dishes.filter((dish) => dishMatchesSeller(dish, seller)).length;

  const sellerDishCountBySubscription = (seller, subscriptionType) =>
    dishes.filter(
      (dish) =>
        dishMatchesSeller(dish, seller) &&
        (normalizeText(dish.subscriptionType || "daily") === normalizeText(subscriptionType) ||
          normalizeText(dish.subscriptionType || "daily") === "all")
    ).length;

  const selectedSellerDishes = selectedSeller
    ? dishes.filter((dish) => dishMatchesSeller(dish, selectedSeller))
    : [];

  const visibleDishes =
    activeSellerType === "Home Cook"
      ? selectedSellerDishes.filter((dish) => {
          const sub = normalizeText(dish.subscriptionType || "daily");
          return sub === normalizeText(activeSubscriptionType) || sub === "all";
        })
      : selectedSellerDishes;

  // ─── Cart logic ───────────────────────────────────────────────────────────────
  const addToCart = (dish) => {
    if (cartItems.length > 0) {
      const existingSeller =
        cartItems[0].sellerId || cartItems[0].businessName || cartItems[0].sellerName;
      const newSeller = dish.sellerId || dish.businessName || dish.sellerName;
      if (newSeller !== existingSeller) {
        alert("You can order from only one seller at a time. Please clear your cart first.");
        return;
      }
      const existingSub = normalizeText(cartItems[0].subscriptionType || "daily");
      const newSub = normalizeText(dish.subscriptionType || "daily");
      if (existingSub !== newSub && existingSub !== "all" && newSub !== "all") {
        alert("You can only add items of the same subscription type to your cart.");
        return;
      }
    }
    setCartSubscriptionType(dish.subscriptionType || "Daily");
    setCartItems((prev) => [...prev, dish]);
  };

  const removeFromCart = (dish) => {
    const index = cartItems.findIndex((item) => item.id === dish.id);
    if (index === -1) return;
    const updated = [...cartItems];
    updated.splice(index, 1);
    if (updated.length === 0) setCartSubscriptionType("Daily");
    setCartItems(updated);
  };

  const getDishQuantity = (dish) =>
    cartItems.filter((item) => item.id === dish.id).length;

  // ─── Delivery pricing model ───────────────────────────────────────────────────
  //  Daily   → ₹50 for 1st km + ₹14 per extra km   × 1
  //  Weekly  → ₹48 for 1st km + ₹14 per extra km   × 7
  //  Monthly → ₹48 for 1st km + ₹14 per extra km   × 30

  const getDaysMultiplier = (subscriptionType) => {
    const sub = normalizeText(subscriptionType);
    if (sub === "weekly")  return 7;
    if (sub === "monthly") return 30;
    return 1;
  };

  const calcPerDelivery = (km, subscriptionType) => {
    const baseCharge = 50;
    if (km <= 1) return baseCharge;
    return Math.ceil(baseCharge + (km - 1) * 14);
  };

  const calcTotalDelivery = (km, subscriptionType) => {
    return calcPerDelivery(km, subscriptionType) * getDaysMultiplier(subscriptionType);
  };

  // ─── Geo ──────────────────────────────────────────────────────────────────────
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ─── Checkout ─────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cartItems.length === 0) { alert("Cart is empty!"); return; }
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setCheckoutLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customerLat = position.coords.latitude;
        const customerLng = position.coords.longitude;
        const sellerLat   = cartItems[0].latitude;
        const sellerLng   = cartItems[0].longitude;

        if (sellerLat == null || sellerLng == null) {
          alert("Seller location unavailable. Please re-add dishes uploaded after seller location update.");
          setCheckoutLoading(false);
          return;
        }

        const km = calculateDistance(customerLat, customerLng, sellerLat, sellerLng);

        if (km > 10) {
          alert("Sorry! we couldn't deliver your order as we deliver orders Upto 10kms!!!");
          setCheckoutLoading(false);
          return;
        }

        const subType   = cartSubscriptionType || "Daily";
        const perDay    = calcPerDelivery(km, subType);
        const days      = getDaysMultiplier(subType);
        const delivery  = perDay * days;
        const totalFood = cartItems.reduce((sum, item) => sum + Number(item.price), 0);

        setDistance(km.toFixed(2));
        setPerDeliveryCharge(perDay);
        setDeliveryDays(days);
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

  // ─── Payment ──────────────────────────────────────────────────────────────────
  const proceedToPayment = async () => {
    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
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
              groupedItems[item.dishName] = { quantity: 1 };
            }
          });

          let itemMessage = "";
          Object.keys(groupedItems).forEach((name) => {
            itemMessage += `${name} x ${groupedItems[name].quantity}%0A`;
          });

          const subType = cartSubscriptionType || "Daily";
          const days    = getDaysMultiplier(subType);

          const whatsappMessage =
            `Welcome To Froostro!%0A%0A` +
            `New Paid Order Received (${subType} Plan)%0A%0A` +
            `Items:%0A${itemMessage}%0A` +
            `Combo/Food Total: ${currencySymbol}${foodTotal}%0A` +
            `Distance: ${distance} km%0A` +
            `Delivery per day: ${currencySymbol}${perDeliveryCharge}%0A` +
            `Days: ${days}%0A` +
            `Total Delivery Charge: ${currencySymbol}${deliveryCharge}%0A` +
            `Grand Total Paid: ${currencySymbol}${grandTotal}`;

          window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank");
          alert("Payment successful!");
          setCartItems([]);
          setCartSubscriptionType("Daily");
          setCheckoutOpen(false);
        },

        theme: { color: "#f97316" },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please try again.");
    }
  };

  // ─── Dish card ────────────────────────────────────────────────────────────────
  const renderDishCard = (dish) => {
    const subType   = dish.subscriptionType || "Daily";
    const isWeekly  = normalizeText(subType) === "weekly";
    const isMonthly = normalizeText(subType) === "monthly";

    // comboItems stored as array OR comma-separated string in Firestore
    const comboItems = Array.isArray(dish.comboItems)
      ? dish.comboItems
      : dish.comboItems
      ? String(dish.comboItems).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    return (
      <div key={dish.id} className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Image */}
        <div className="relative">
          <img
            src={dish.imageUrl}
            alt={dish.dishName}
            className="w-full h-64 object-cover"
          />

          {/* Subscription ribbon */}
          <div
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow ${
              isWeekly
                ? "bg-blue-100 text-blue-700"
                : isMonthly
                ? "bg-purple-100 text-purple-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {isWeekly ? "📅 Weekly" : isMonthly ? "🗓️ Monthly" : "☀️ Daily"}
          </div>

          {/* Quantity controls */}
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

        <div className="p-6 flex flex-col gap-3 flex-1">
          <h3 className="text-2xl font-bold">{dish.dishName}</h3>
          <p className="text-gray-600">{dish.description}</p>

          {/* Combo items list for Weekly / Monthly */}
          {(isWeekly || isMonthly) && comboItems.length > 0 && (
            <div
              className={`rounded-xl p-4 ${
                isMonthly
                  ? "bg-purple-50 border border-purple-100"
                  : "bg-blue-50 border border-blue-100"
              }`}
            >
              <p
                className={`text-sm font-bold mb-2 ${
                  isMonthly ? "text-purple-700" : "text-blue-700"
                }`}
              >
                {isMonthly ? "🗓️ Monthly Combo Includes:" : "📅 Weekly Combo Includes:"}
              </p>
              <ul className="space-y-1">
                {comboItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isMonthly ? "bg-purple-400" : "bg-blue-400"
                      }`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price row */}
          <div className="mt-auto">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-bold text-orange-600">
                {currencySymbol}{dish.price}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {isWeekly ? "/ week" : isMonthly ? "/ month" : "/ meal"}
                </span>
              </p>
            </div>


          </div>
        </div>
      </div>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* ══ Checkout Modal ══ */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-orange-600 text-center">
              Checkout Summary
            </h2>
            <p className="text-center text-sm font-semibold text-gray-500 mt-1">
              {normalizeText(cartSubscriptionType) === "weekly"
                ? "📅 Weekly Plan"
                : normalizeText(cartSubscriptionType) === "monthly"
                ? "🗓️ Monthly Plan"
                : "☀️ Daily Order"}
            </p>

            <div className="mt-6 space-y-3">
              {/* Food / combo price */}
              <div className="flex justify-between text-base">
                <span className="text-gray-700">
                  {normalizeText(cartSubscriptionType) !== "daily"
                    ? "Combo / Item Price"
                    : "Food Total"}
                </span>
                <span className="font-semibold">
                  {currencySymbol}{foodTotal}
                </span>
              </div>

              {/* Distance */}
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Your Distance from Seller</span>
                <span className="font-semibold">{distance} km</span>
              </div>

              {/* Delivery breakdown */}
              {deliveryDays > 1 ? (
                <>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Delivery charge / day</span>
                    <span className="font-semibold">
                      {currencySymbol}{perDeliveryCharge}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Number of days</span>
                    <span className="font-semibold">× {deliveryDays} days</span>
                  </div>
                  <div
                    className={`flex justify-between rounded-xl px-4 py-3 ${
                      deliveryDays === 7
                        ? "bg-blue-50 text-blue-800"
                        : "bg-purple-50 text-purple-800"
                    }`}
                  >
                    <span className="font-bold">
                      Total Delivery ({deliveryDays === 7 ? "7 days" : "30 days"})
                    </span>
                    <span className="font-bold">
                      {currencySymbol}{deliveryCharge}
                    </span>
                  </div>
                  {/* Calculation breakdown */}
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                    <p className="font-semibold text-gray-700 mb-1">How is delivery calculated?</p>
                    ₹50 (1st km) + ₹14 × {(parseFloat(distance) > 1 ? (parseFloat(distance) - 1).toFixed(2) : 0)} km
                    = ₹{perDeliveryCharge}/day
                    <br />
                    ₹{perDeliveryCharge} × {deliveryDays} days = <strong>₹{deliveryCharge}</strong>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Delivery Charge</span>
                  <span className="font-semibold">{currencySymbol}{deliveryCharge}</span>
                </div>
              )}

              {/* Grand total */}
              <div className="flex justify-between border-t pt-4 mt-2">
                <span className="text-lg font-bold">Grand Total</span>
                <span className="text-lg font-bold text-orange-600">
                  {currencySymbol}{grandTotal}
                </span>
              </div>
            </div>

            {deliveryCharge > 50 && (
              <p className="mt-5 text-sm text-red-600 bg-red-50 p-4 rounded-xl">
                Please do not think you are paying extra, the delivery charges
                will be going to our logistics partner Porter as we currently
                do not have our own logistics, but we will make it as soon as
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

        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Froostro"
              className="w-14 h-14 md:w-30 md:h-30 rounded-full object-cover"
            />
            <h1 className="text-3xl font-bold text-orange-600">FROOSTRO</h1>
          </div>
          <div className="flex gap-3">
            <div className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
              Cart ({cartItems.length})
              {cartItems.length > 0 && (
                <span className="text-xs bg-white text-orange-600 px-2 py-0.5 rounded-full font-bold">
                  {cartSubscriptionType}
                </span>
              )}
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

        {/* ── Hero ── */}
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

        {/* ══ Main: Seller Tabs + Menu ══ */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">

            <div className="text-center">
              <h2 className="text-4xl font-bold text-orange-600">
                Choose Your Food Partner
              </h2>
              <p className="text-gray-600 mt-4">
                Browse onboarded home cooks and restaurants, then open their menu.
              </p>
            </div>

            {/* Home Cooks / Restaurants toggle */}
            <div className="mt-10 flex justify-center">
              <div className="bg-white shadow-lg rounded-2xl p-2 flex gap-2">
                {sellerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setActiveSellerType(option.value);
                      setSelectedSeller(null);
                      setActiveSubscriptionType("Daily");
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition ${
                      activeSellerType === option.value
                        ? "bg-orange-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-orange-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seller cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {filteredSellers.length > 0 ? (
                filteredSellers.map((seller) => {
                  const isActive = selectedSeller?.id === seller.id;
                  return (
                    <button
                      key={seller.id}
                      onClick={() => {
                        setSelectedSeller(seller);
                        setActiveSubscriptionType("Daily");
                      }}
                      className={`text-left bg-white rounded-2xl shadow-xl p-6 border-2 transition ${
                        isActive
                          ? "border-orange-500 ring-2 ring-orange-300"
                          : "border-transparent hover:border-orange-200"
                      }`}
                    >
                      <p className="text-sm font-semibold text-orange-600">
                        {seller.sellerType}
                      </p>
                      <h3 className="text-2xl font-bold mt-2">{seller.displayName}</h3>
                      <p className="text-gray-600 mt-2">
                        Managed by {seller.sellerName || "Froostro seller"}
                      </p>

                      {activeSellerType === "Home Cook" ? (
                        <div className="mt-5 flex gap-2 flex-wrap">
                          {subscriptionOptions.map((sub) => {
                            const count = sellerDishCountBySubscription(seller, sub.value);
                            return (
                              <span
                                key={sub.value}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  sub.value === "Weekly"
                                    ? "bg-blue-100 text-blue-700"
                                    : sub.value === "Monthly"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {sub.emoji} {sub.value}: {count}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-5 inline-flex bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold">
                          {sellerDishCount(seller)} dishes available
                        </p>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 col-span-3">
                  No {activeSellerType === "Home Cook" ? "home cooks" : "restaurants"} onboarded yet.
                </p>
              )}
            </div>

            {/* ── Seller menu panel ── */}
            <div className="mt-16">
              {selectedSeller ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                      <p className="font-semibold text-orange-600">
                        {activeSellerType === "Home Cook" ? "🏠 Home Cook Menu" : "🍽️ Restaurant Menu"}
                      </p>
                      <h2 className="text-4xl font-bold mt-2">
                        {selectedSeller.displayName}
                      </h2>
                      <p className="text-gray-600 mt-3">
                        {activeSellerType === "Home Cook"
                          ? "Select a plan to browse daily, weekly, or monthly dishes."
                          : "Browse all dishes from this restaurant."}
                      </p>
                    </div>

                    {/* Daily / Weekly / Monthly tabs — Home Cooks only */}
                    {activeSellerType === "Home Cook" && (
                      <div className="bg-white shadow-lg rounded-2xl p-2 flex gap-2">
                        {subscriptionOptions.map((option) => {
                          const count = sellerDishCountBySubscription(selectedSeller, option.value);
                          const isActive = activeSubscriptionType === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setActiveSubscriptionType(option.value)}
                              className={`px-5 py-3 rounded-xl font-semibold transition flex flex-col items-center gap-1 ${
                                isActive
                                  ? option.value === "Weekly"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : option.value === "Monthly"
                                    ? "bg-purple-600 text-white shadow-md"
                                    : "bg-black text-white shadow-md"
                                  : "text-gray-700 hover:bg-orange-100"
                              }`}
                            >
                              <span className="text-lg">{option.emoji}</span>
                              <span>{option.label}</span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? "bg-white text-gray-800"
                                    : option.value === "Weekly"
                                    ? "bg-blue-100 text-blue-700"
                                    : option.value === "Monthly"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {count} dish{count !== 1 ? "es" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Plan info banner */}
                  {activeSellerType === "Home Cook" && (
                    <div
                      className={`mt-6 rounded-2xl px-6 py-4 flex items-start gap-3 border ${
                        activeSubscriptionType === "Weekly"
                          ? "bg-blue-50 border-blue-200"
                          : activeSubscriptionType === "Monthly"
                          ? "bg-purple-50 border-purple-200"
                          : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <span className="text-2xl">
                        {subscriptionOptions.find((o) => o.value === activeSubscriptionType)?.emoji}
                      </span>
                      <div>
                        <p
                          className={`font-bold ${
                            activeSubscriptionType === "Weekly"
                              ? "text-blue-700"
                              : activeSubscriptionType === "Monthly"
                              ? "text-purple-700"
                              : "text-orange-700"
                          }`}
                        >
                          {activeSubscriptionType} Plan
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {activeSubscriptionType === "Daily" &&
                            "Fresh meals delivered every day."}
                          {activeSubscriptionType === "Weekly" &&
                            "Weekly combo curated by the seller. Delivery is calculated at checkout based on your distance."}
                          {activeSubscriptionType === "Monthly" &&
                            "Monthly combo curated by the seller. Delivery is calculated at checkout based on your distance."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dish grid */}
                  <div className="grid md:grid-cols-3 gap-8 mt-10">
                    {visibleDishes.length > 0 ? (
                      visibleDishes.map((dish) => renderDishCard(dish))
                    ) : (
                      <div className="col-span-3 text-center bg-white rounded-2xl shadow-xl p-10">
                        <p className="text-5xl mb-4">🍽️</p>
                        <p className="text-xl font-semibold text-gray-700">
                          No{" "}
                          {activeSellerType === "Home Cook"
                            ? `${activeSubscriptionType.toLowerCase()} `
                            : ""}
                          dishes uploaded yet by{" "}
                          <span className="text-orange-600">
                            {selectedSeller.displayName}
                          </span>.
                        </p>
                        <p className="text-gray-500 mt-2">
                          Check back soon or try another{" "}
                          {activeSellerType === "Home Cook" ? "plan" : "seller"}.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
                  <p className="text-5xl mb-4">
                    {activeSellerType === "Home Cook" ? "🏠" : "🍽️"}
                  </p>
                  <h3 className="text-2xl font-bold text-orange-600">
                    Select a {activeSellerType === "Home Cook" ? "Home Cook" : "Restaurant"}
                  </h3>
                  <p className="text-gray-600 mt-3">
                    Click a{" "}
                    {activeSellerType === "Home Cook"
                      ? "kitchen or business name"
                      : "restaurant"}{" "}
                    above to browse their menu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Subscription Plans Section ── */}
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
                <div className="text-4xl mb-4">☀️</div>
                <h3 className="text-2xl font-bold text-orange-600">Daily Plan</h3>
                <p className="mt-4 text-gray-600">
                  Fresh meals prepared and delivered every day.
                </p>
                <p className="mt-3 text-sm font-semibold text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                  Fresh meals delivered every day.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-2xl font-bold text-blue-600">Weekly Plan</h3>
                <p className="mt-4 text-gray-600">
                  A seller-curated weekly combo — hassle-free 7-day meal planning.
                </p>
                <p className="mt-3 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                  Delivery calculated at checkout based on your location.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-4xl mb-4">🗓️</div>
                <h3 className="text-2xl font-bold text-purple-600">Monthly Plan</h3>
                <p className="mt-4 text-gray-600">
                  Best value! A seller-curated monthly combo for 30 days of affordable meals.
                </p>
                <p className="mt-3 text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                  Delivery calculated at checkout based on your location.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-black text-white py-8 text-center">
          <p>© 2026 Froostro. All Rights Reserved.</p>
        </footer>
      </main>
    </>
  );
}