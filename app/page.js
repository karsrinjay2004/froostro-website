export default function Home() {
  const whatsappNumber = "918822780887";

  return (
    <main className="min-h-screen bg-white text-black">
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold">
            FROOSTRO
          </h1>

          <p className="mt-6 text-xl max-w-3xl mx-auto">
            Connecting Home Cooks & Restaurants With Customers
            Through Affordable, Home-Style Meals.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Welcome%20To%20Froostro!!%20Please%20share%20your%20item%20details%20with%20the%20quantity%20that%20you%20want%20to%20place%20an%20order.`}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
            >
              Order on WhatsApp
            </a>

            <a
              href="#seller"
              className="border border-white px-6 py-3 rounded-xl font-semibold"
            >
              Become a Seller
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold">
            Why Froostro?
          </h2>

          <p className="mt-6 text-lg text-gray-600">
            Froostro helps customers access affordable meals while
            enabling home cooks and restaurants to earn more through
            direct food selling.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-14">
            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Affordable Food
              </h3>

              <p className="mt-4 text-gray-600">
                Lower commissions help customers get food at fair prices.
              </p>
            </div>

            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Empowering Home Cooks
              </h3>

              <p className="mt-4 text-gray-600">
                Home cooks can earn directly from their kitchens.
              </p>
            </div>

            <div className="shadow-xl rounded-2xl p-8 border">
              <h3 className="text-2xl font-bold">
                Subscription Meals
              </h3>

              <p className="mt-4 text-gray-600">
                Customers can choose daily, weekly or monthly plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION PLANS */}
      <section className="bg-gray-100 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-4xl font-bold">
            Subscription Plans
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-14">

            {/* DAILY */}
            <div className="bg-white shadow-xl rounded-2xl p-8">
              <h3 className="text-2xl font-bold">
                Daily Plan
              </h3>

              <p className="text-4xl font-bold mt-4">
                ₹149/day
              </p>

              <ul className="mt-6 space-y-3 text-gray-600">
                <li>Fresh home meals</li>
                <li>Flexible ordering</li>
                <li>Affordable pricing</li>
              </ul>

              <button className="mt-8 bg-black text-white px-6 py-3 rounded-xl">
                Choose Plan
              </button>
            </div>

            {/* WEEKLY */}
            <div className="bg-white shadow-xl rounded-2xl p-8">
              <h3 className="text-2xl font-bold">
                Weekly Plan
              </h3>

              <p className="text-4xl font-bold mt-4">
                ₹899/week
              </p>

              <ul className="mt-6 space-y-3 text-gray-600">
                <li>7-day meal support</li>
                <li>Priority delivery</li>
                <li>Better savings</li>
              </ul>

              <button className="mt-8 bg-black text-white px-6 py-3 rounded-xl">
                Choose Plan
              </button>
            </div>

            {/* MONTHLY */}
            <div className="bg-white shadow-xl rounded-2xl p-8">
              <h3 className="text-2xl font-bold">
                Monthly Plan
              </h3>

              <p className="text-4xl font-bold mt-4">
                ₹3499/month
              </p>

              <ul className="mt-6 space-y-3 text-gray-600">
                <li>Lowest pricing</li>
                <li>Dedicated support</li>
                <li>Consistent meal delivery</li>
              </ul>

              <button className="mt-8 bg-black text-white px-6 py-3 rounded-xl">
                Choose Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* SELLER REGISTRATION */}
      <section
        id="seller"
        className="py-20 px-6"
      >
        <div className="max-w-4xl mx-auto">

          <h2 className="text-4xl font-bold text-center">
            Seller Registration
          </h2>

          <p className="text-center text-gray-600 mt-4">
            Join as a Home Cook Seller or Restaurant Partner.
          </p>

          <div className="mt-12 grid gap-6">

            <input
              type="text"
              placeholder="Seller Name"
              className="border p-4 rounded-xl"
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="border p-4 rounded-xl"
            />

            <select className="border p-4 rounded-xl">
              <option>Select Seller Type</option>
              <option>Home Cook Seller</option>
              <option>Restaurant Seller</option>
            </select>

            <select className="border p-4 rounded-xl">
              <option>Select Subscription Compatibility</option>
              <option>Daily Orders</option>
              <option>Weekly Subscription</option>
              <option>Monthly Subscription</option>
              <option>All Types</option>
            </select>

            <textarea
              placeholder="Food items you provide"
              rows="5"
              className="border p-4 rounded-xl"
            />

            <button className="bg-black text-white py-4 rounded-xl font-semibold">
              Submit Registration
            </button>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-8 text-center">
        <p>
          © 2026 Froostro. All Rights Reserved.
        </p>
      </footer>

    </main>
  );
}