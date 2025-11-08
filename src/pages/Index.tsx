import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userProfile) {
      const role = userProfile.user_type ?? userProfile.role;
      switch (role) {
        case "dealer":
          navigate("/dealer/admin");
          break;
        case "staff":
          navigate("/dealer/dashboard");
          break;
        case "driver":
          navigate("/driver/dashboard");
          break;
        default:
          console.log("Unknown user type:", role);
          break;
      }
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <img
                src="/swaprunn-logo-2025.png?v=20251015"
                alt="SwapRunn"
                className="h-10 w-auto"
              />
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-neutral-400 hover:text-white transition-colors text-sm font-medium"
              >
                Log In
              </Link>
              <Button
                asChild
                className="bg-[#E11900] hover:bg-[#B51400] text-white"
              >
                <Link to="/dealers/registration">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-neutral-950">
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Deliver Cars.
                  <br />
                  <span className="text-[#E11900]">Simplified.</span>
                </h1>
                <p className="text-xl text-neutral-400 mb-4">
                  Built by a Dealer, for Dealers.
                </p>
                <p className="text-lg text-neutral-300 mb-10 leading-relaxed">
                  SwapRunn connects dealerships with reliable drivers for customer deliveries, dealer swaps, and vehicle logistics — no spreadsheets, no chaos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[#E11900] hover:bg-[#B51400] text-white text-lg px-8 py-6"
                  >
                    <Link to="/dealers/registration">Join SwapRunn</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="bg-neutral-800 border-2 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 text-lg px-8 py-6 font-semibold"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>

                <p className="text-sm text-neutral-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#E11900] hover:underline">
                    Log in →
                  </Link>
                </p>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E11900]/10 to-transparent"></div>
                  <div className="relative z-10 text-center p-8">
                    <Truck className="w-24 h-24 text-[#E11900] mx-auto mb-6" aria-hidden="true" />
                    <p className="text-2xl font-bold text-white mb-2">
                      Dealer Dashboard Preview
                    </p>
                    <p className="text-neutral-400">
                      Track deliveries, manage drivers, coordinate logistics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-neutral-400">
                Three steps. Zero complexity.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <div className="w-16 h-16 bg-[#E11900] rounded-lg flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Create a Delivery Job
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  Add customer info, pickup/drop locations, and delivery notes — all in one form.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <div className="w-16 h-16 bg-[#E11900] rounded-lg flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Match a Driver Instantly
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  Available drivers accept jobs in real time.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <div className="w-16 h-16 bg-[#E11900] rounded-lg flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Track Every Step
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  Monitor delivery status, driver location, and completion confirmations.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-neutral-300">
                Dealers save hours every week — and customers love on-time deliveries.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Why SwapRunn
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#E11900]" aria-hidden="true" />
                  For Dealerships
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">Centralized dashboard</p>
                      <p className="text-neutral-400 text-sm">Manage all deliveries from one place</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">Verified, insured drivers</p>
                      <p className="text-neutral-400 text-sm">Every driver is vetted and covered</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">Real-time updates</p>
                      <p className="text-neutral-400 text-sm">Know exactly where every vehicle is</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Truck className="w-8 h-8 text-[#E11900]" aria-hidden="true" />
                  For Drivers
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">Instant job access</p>
                      <p className="text-neutral-400 text-sm">Accept jobs directly from your phone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">GPS tracking + earnings</p>
                      <p className="text-neutral-400 text-sm">Navigate and track your pay in real time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E11900] mt-1 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-white font-semibold">Easy payouts</p>
                      <p className="text-neutral-400 text-sm">Get paid quickly via Stripe</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900/50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-10 lg:p-14">
              <div className="text-center mb-8">
                <p className="text-[#E11900] font-bold uppercase tracking-wider text-sm mb-4">
                  From the Founder
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  "I built SwapRunn because coordinating deliveries was chaos."
                </h2>
              </div>

              <div className="space-y-6 text-lg text-neutral-300 leading-relaxed">
                <p>
                  At McGee Toyota of Claremont, we sell over 200 cars a month. Managing customer deliveries, trade swaps, and driver schedules was a daily nightmare. SwapRunn eliminates that.
                </p>
                <p className="text-neutral-400 italic text-base">
                  — Luke Tancreti, Sales Manager & Founder
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Simple, Predictable Pricing
              </h2>
            </div>

            <div className="bg-neutral-900 border-2 border-[#E11900] rounded-2xl p-10 lg:p-14">
              <div className="text-center mb-8">
                <div className="inline-block bg-[#E11900] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase mb-6">
                  Dealership Plan
                </div>
                <div className="mb-6">
                  <span className="text-6xl font-black text-white">$99</span>
                  <span className="text-2xl text-neutral-400">/mo</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#E11900] flex-shrink-0" aria-hidden="true" />
                  <span className="text-lg text-neutral-300">Unlimited jobs</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#E11900] flex-shrink-0" aria-hidden="true" />
                  <span className="text-lg text-neutral-300">Unlimited drivers</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#E11900] flex-shrink-0" aria-hidden="true" />
                  <span className="text-lg text-neutral-300">Real-time tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#E11900] flex-shrink-0" aria-hidden="true" />
                  <span className="text-lg text-neutral-300">Dedicated support</span>
                </div>
              </div>

              <p className="text-center text-neutral-400 text-sm mb-8">
                No free trial. No surprise fees. Just faster deliveries.
              </p>

              <div className="text-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#E11900] hover:bg-[#B51400] text-white text-lg px-12 py-6"
                >
                  <Link to="/dealers/registration">Get Started Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to make delivery chaos disappear?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#E11900] hover:bg-[#B51400] text-white text-lg px-10 py-6"
              >
                <Link to="/dealers/registration">Register Your Dealership</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-neutral-800 border-2 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 text-lg px-10 py-6 font-semibold"
              >
                <Link to="/driver/auth">Driver Sign Up</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-neutral-500 text-sm">
                SwapRunn © 2025 | Built for Dealerships
              </div>
              <div className="flex gap-6">
                <Link to="/contact" className="text-neutral-500 hover:text-white text-sm transition-colors">
                  Support
                </Link>
                <Link to="/privacy" className="text-neutral-500 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Index;
