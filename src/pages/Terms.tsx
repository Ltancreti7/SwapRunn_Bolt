import SiteHeader from "@/components/SiteHeader";
import BackButton from "@/components/BackButton";
import mapBackgroundImage from "@/assets/map-background.jpg";

const Terms = () => {
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* SEO Meta Tags */}
      <title>Terms of Service - SwapRunn Auto Delivery Platform</title>
      <meta
        name="description"
        content="Terms of service for SwapRunn's auto delivery and swap management platform for dealers and drivers."
      />
      <link rel="canonical" href="https://swaprunn.com/terms" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

      <div className="relative z-10 px-4 pt-24 py-12">
        <div className="content-container">
          <h1 className="text-4xl font-bold text-white mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none text-white">
            <p className="text-white/70 text-lg mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Acceptance of Terms
              </h2>
              <p className="mb-4 text-white/90">
                By accessing and using SwapRunn's services, you accept and agree
                to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Service Description
              </h2>
              <p className="mb-4 text-white/90">
                SwapRunn provides a platform for auto dealers to manage vehicle
                deliveries and swaps, connecting them with qualified drivers for
                transportation services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                User Responsibilities
              </h2>
              <p className="mb-4 text-white/90">Users agree to:</p>
              <ul className="list-disc pl-6 mb-4 text-white/90">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of their account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Use the service only for legitimate business purposes</li>
                <li>
                  Treat all platform users with respect and professionalism
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Payment Terms
              </h2>
              <p className="mb-4 text-white/90">
                Subscription fees are billed monthly in advance. All fees are
                non-refundable except as required by law. We reserve the right
                to modify pricing with 30 days notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Driver Requirements
              </h2>
              <p className="mb-4 text-white/90">All drivers must:</p>
              <ul className="list-disc pl-6 mb-4 text-white/90">
                <li>Pass background checks through our partner Checkr</li>
                <li>{"Maintain valid driver's license and insurance"}</li>
                <li>Complete platform onboarding and training</li>
                <li>Maintain professional conduct at all times</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Limitation of Liability
              </h2>
              <p className="mb-4 text-white/90">
                SwapRunn shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your
                use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Contact Information
              </h2>
              <p className="text-white/90">
                For questions about these Terms of Service, contact us at{" "}
                <a
                  href="mailto:legal@swaprunn.com"
                  className="text-[#DC2626] hover:underline hover:text-red-400"
                >
                  legal@swaprunn.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
