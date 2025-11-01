import { Link } from "react-router-dom";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, ShieldCheck, Gauge } from "lucide-react";

const Drivers = () => {
  return (
    <>
      {/* Top Header - Clean & Simple */}
      <header className="fixed top-2 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/swaprunn-logo-2025.png?v=20251001"
                alt="SwapRunn"
                className="h-12 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>

            {/* Right - Simple Navigation */}
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                For Dealerships
              </Link>
              <Link
                to="/contact"
                className="text-white/70 hover:text-white transition-colors font-medium"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div
        className="min-h-screen relative bg-black"
        style={{
          backgroundImage: `url(${mapBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/70 z-0"></div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-16 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Two Column Layout: Hero + Login */}
            <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8 lg:gap-16 items-center min-h-[calc(100vh-120px)]">
              {/* Left Column: Hero Content */}
              <div className="text-center lg:text-left flex items-center justify-center lg:justify-start">
                <div className="relative">
                  <style>{`
                    @keyframes fadeInUp {
                      0% {
                        opacity: 0;
                        transform: translateY(30px);
                      }
                      100% {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                    
                    @keyframes underlineSweep {
                      0% {
                        transform: scaleX(0);
                        opacity: 0;
                      }
                      100% {
                        transform: scaleX(1);
                        opacity: 1;
                      }
                    }
                    
                    .fade-in-up {
                      animation: fadeInUp 0.8s ease-out forwards;
                      opacity: 0;
                    }
                    
                    .underline-sweep {
                      animation: underlineSweep 0.6s ease-out forwards;
                      animation-delay: 1.2s;
                      transform-origin: left;
                      opacity: 0;
                    }
                  `}</style>

                  <h1 className="font-['Inter',sans-serif] space-y-2">
                    {/* Drive. */}
                    <div
                      className="text-5xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight fade-in-up"
                      style={{
                        animationDelay: "0.2s",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Drive.
                    </div>

                    {/* Earn. */}
                    <div
                      className="text-5xl sm:text-6xl lg:text-7xl font-medium text-white tracking-tight fade-in-up"
                      style={{
                        animationDelay: "0.4s",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Earn.
                    </div>

                    {/* Repeat. with underline */}
                    <div className="relative inline-block">
                      <div
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight fade-in-up"
                        style={{
                          animationDelay: "0.6s",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        Repeat.
                      </div>
                      {/* Red underline */}
                      <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#E11900] underline-sweep rounded-full"></div>
                    </div>
                  </h1>
                </div>
              </div>

              {/* Right Column: Login Card */}
              <div className="flex justify-center lg:justify-end">
                <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-3">
                        Driver Portal
                      </h2>
                      <p className="text-white/80 text-base">
                        Sign in or create your account
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-[#E11900] hover:bg-[#B51400] text-white h-14 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Link to="/driver-auth?mode=login">Sign In</Link>
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/30"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-black/50 text-white/70 font-medium">
                            or
                          </span>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-transparent hover:bg-white/10 border-2 border-white/50 hover:border-white/70 text-white h-14 rounded-lg font-semibold text-lg transition-all duration-200"
                      >
                        <Link to="/driver-auth?mode=signup">
                          Create Account
                        </Link>
                      </Button>
                    </div>

                    <p className="mt-8 text-center text-white/70 text-sm leading-relaxed">
                      New drivers complete a quick background check
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Benefits Grid - Below the Fold */}
            <div className="max-w-5xl mx-auto mt-16">
              <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
                Why Drive with SwapRunn?
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-colors duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-[#E11900]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-7 w-7 text-[#E11900]" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3">
                      Flexible Schedule
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Work when you want, where you want. Perfect for full-time
                      or side income.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-colors duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-[#E11900]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-7 w-7 text-[#E11900]" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3">
                      Great Earnings
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Competitive pay rates with weekly direct deposits and
                      insurance coverage.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-colors duration-200">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-[#E11900]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="h-7 w-7 text-[#E11900]" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3">
                      Trusted Platform
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Professional network backed by established dealerships
                      nationwide.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drivers;
