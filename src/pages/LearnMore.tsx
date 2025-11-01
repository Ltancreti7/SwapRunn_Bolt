import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import BackButton from "@/components/BackButton";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const LearnMore = () => {
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

      {/* Learn More Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-white">
                Learn More
              </h1>

              <p className="text-lg text-white/80 mb-8">
                Discover the powerful features that make SwapRunn the preferred
                choice for dealership logistics.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-[#E11900] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Real-time tracking & notifications
                    </h3>
                    <p className="text-white/70">
                      Live GPS tracking with instant updates on job progress.
                      Both dealers and customers receive real-time
                      notifications.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-[#E11900] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Automated dispatch
                    </h3>
                    <p className="text-white/70">
                      Smart matching to verified drivers in your area. Our
                      algorithm finds the best available driver within minutes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-[#E11900] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Analytics & reporting
                    </h3>
                    <p className="text-white/70">
                      Comprehensive insights into delivery performance, driver
                      ratings, and operational efficiency.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-[#E11900] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Proof of delivery
                    </h3>
                    <p className="text-white/70">
                      Photo documentation, digital signatures, and delivery
                      confirmations for complete transparency.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
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
                  <Link to="/dealer/role-selection">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                  <img
                    src="/dashboard-preview.png"
                    alt="SwapRunn Dashboard Preview"
                    className="w-full h-auto object-cover"
                  />
                </CardContent>
              </Card>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#E11900]/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#E11900]/10 rounded-full blur-2xl"></div>
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

export default LearnMore;
