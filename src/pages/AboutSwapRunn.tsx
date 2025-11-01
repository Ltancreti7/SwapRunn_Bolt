import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import BackButton from "@/components/BackButton";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const AboutSwapRunn = () => {
  return (
    <div
      className="min-h-screen relative bg-black"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "120%",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0"></div>

      {/* About Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              About SwapRunn
            </h1>

            <div className="space-y-8 mb-12">
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Join thousands of dealers who trust SwapRunn for their delivery
                needs. Our platform streamlines operations while providing
                unmatched transparency and reliability.
              </p>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-left">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Our Mission
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  SwapRunn was founded to solve the frustrating logistics
                  challenges that dealerships face every day.
                  {
                    "We believe that vehicle delivery shouldn't be a bottleneck in your sales process."
                  }
                </p>

                <h2 className="text-2xl font-bold text-white mb-6">
                  Why Choose SwapRunn?
                </h2>
                <ul className="space-y-4 text-white/80">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#E11900] rounded-full mt-3 flex-shrink-0"></div>
                    <span>
                      <strong className="text-white">Trusted Network:</strong>{" "}
                      All drivers are background-checked and verified
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#E11900] rounded-full mt-3 flex-shrink-0"></div>
                    <span>
                      <strong className="text-white">Real-time Updates:</strong>{" "}
                      GPS tracking and instant notifications keep everyone
                      informed
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#E11900] rounded-full mt-3 flex-shrink-0"></div>
                    <span>
                      <strong className="text-white">
                        Seamless Integration:
                      </strong>{" "}
                      Easy to use platform that fits into your existing workflow
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#E11900] rounded-full mt-3 flex-shrink-0"></div>
                    <span>
                      <strong className="text-white">24/7 Support:</strong> Real
                      humans available when you need help
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-12 px-8 rounded-2xl"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-[#E11900] hover:bg-[#E11900]/90 text-white h-12 px-8 rounded-2xl"
              >
                <Link to="/dealer/auth">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/swaprunn-logo-2025.png?v=20251001"
                alt="SwapRunn"
                className="h-8 w-auto"
              />
              <span className="text-white/70">© SwapRunn</span>
            </div>

            <div className="flex gap-6">
              <Link
                to="/privacy"
                className="text-white/70 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-white/70 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/about"
                className="text-white/70 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutSwapRunn;
