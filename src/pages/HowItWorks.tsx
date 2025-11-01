import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  Clock,
  MapPin,
  User,
  Car,
  Phone,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import mapBackgroundImage from "@/assets/map-background.jpg";

const HowItWorks = () => {
  const dealerSteps = [
    {
      step: 1,
      title: "Sign In to Your Dealer Portal",
      description:
        "Access your dedicated dealer dashboard with secure authentication and personalized profile management",
      features: [
        "Secure dealer login system",
        "Personalized dashboard access",
        "Profile and company management",
        "Remember login for convenience",
      ],
    },
    {
      step: 2,
      title: "Request a Driver in 4 Simple Steps",
      description:
        "Our streamlined 4-step process makes requesting professional vehicle delivery quick and easy",
      features: [
        "Vehicle details (Year, Make, Model, VIN)",
        "Pickup and delivery addresses",
        "Customer contact information",
        "Timing preferences and special notes",
      ],
    },
    {
      step: 3,
      title: "Track and Manage Deliveries",
      description:
        "Monitor all your delivery requests from your comprehensive dealer dashboard",
      features: [
        "Real-time delivery status tracking",
        "Driver assignment notifications",
        "Pending, assigned, and completed jobs",
        "Professional driver profiles with ratings",
      ],
    },
  ];

  return (
    <div
      className="min-h-screen relative bg-black"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/40 z-0"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-12 pb-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="text-white/80 hover:text-white hover:bg-white/10 mb-8"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            How <span className="text-[#E11900]">SwapRunn</span> Works
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Streamline your vehicle deliveries with our simple, professional
            platform
          </p>
        </div>

        {/* Dealer Side Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              For <span className="text-[#E11900]">Dealerships</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Get your vehicles delivered quickly and professionally with just a
              few clicks
            </p>
          </div>

          <div className="space-y-16">
            {dealerSteps.map((step, index) => (
              <div
                key={step.step}
                className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-16`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#E11900] text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {step.step}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-lg text-white/80 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="space-y-3">
                    {step.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <Check className="h-5 w-5 text-[#E11900] flex-shrink-0" />
                        <span className="text-white/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screenshot Mock */}
                <div className="flex-1 max-w-md lg:max-w-lg">
                  <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[9/16] bg-gradient-to-b from-gray-900 to-black flex items-center justify-center relative">
                        {/* Mock iPhone Frame */}
                        <div className="w-full h-full bg-black rounded-2xl p-1">
                          <div className="w-full h-full bg-gray-900 rounded-xl flex flex-col">
                            {/* Status Bar */}
                            <div className="flex justify-between items-center px-6 py-2 text-white text-sm">
                              <span>12:0{step.step}</span>
                              <div className="flex gap-1">
                                <div className="w-4 h-2 bg-white rounded-sm"></div>
                                <div className="w-6 h-3 border border-white rounded-sm">
                                  <div className="w-full h-full bg-white rounded-sm"></div>
                                </div>
                              </div>
                            </div>

                            {/* Content based on step */}
                            <div className="flex-1 px-6 py-4 flex flex-col">
                              {step.step === 1 && (
                                <>
                                  <div className="text-center mb-8">
                                    <img
                                      src="/swaprunn-logo-2025.png"
                                      alt="SwapRunn"
                                      className="h-8 mx-auto mb-6 opacity-90"
                                    />
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                      Dealer{" "}
                                      <span className="text-[#E11900]">
                                        Sign In
                                      </span>
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                      Access the Dealer Portal
                                    </p>
                                  </div>
                                  <div className="space-y-4 flex-1">
                                    <div>
                                      <label className="text-white text-sm mb-2 block">
                                        Email Address
                                      </label>
                                      <div className="bg-gray-700 rounded-lg p-3 text-white">
                                        ltancreti7@gmail.com
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-white text-sm mb-2 block">
                                        Password
                                      </label>
                                      <div className="bg-gray-700 rounded-lg p-3 text-white">
                                        •••••••••••
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <div className="w-4 h-4 bg-[#E11900] rounded flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                      Remember my login details
                                    </div>
                                    <p className="text-sm text-white/60 italic">
                                      Your email and password will be saved for
                                      faster login next time
                                    </p>
                                  </div>
                                  <Button className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold py-3 rounded-lg">
                                    Sign In
                                  </Button>
                                </>
                              )}

                              {step.step === 2 && (
                                <>
                                  <div className="text-center mb-4">
                                    <h2 className="text-xl font-bold text-white mb-1">
                                      Request a Driver
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                      Step 1 of 4
                                    </p>
                                  </div>
                                  <div className="flex justify-between mb-6">
                                    {[
                                      {
                                        label: "Vehicle",
                                        icon: Car,
                                        active: true,
                                      },
                                      {
                                        label: "Address",
                                        icon: MapPin,
                                        active: false,
                                      },
                                      {
                                        label: "Customer",
                                        icon: User,
                                        active: false,
                                      },
                                      {
                                        label: "Details",
                                        icon: Clock,
                                        active: false,
                                      },
                                    ].map((item, i) => (
                                      <div
                                        key={i}
                                        className={`text-center ${item.active ? "text-[#E11900]" : "text-gray-500"}`}
                                      >
                                        <div
                                          className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${item.active ? "bg-[#E11900]" : "bg-gray-600"}`}
                                        >
                                          <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs">
                                          {item.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-4 flex-1">
                                    <div>
                                      <h3 className="text-white text-lg font-semibold mb-4 text-center">
                                        What vehicle needs delivery?
                                      </h3>
                                      <p className="text-gray-400 text-sm text-center mb-4">
                                        Tell us about the vehicle
                                      </p>
                                    </div>
                                    <select className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600">
                                      <option>2023</option>
                                    </select>
                                    <select className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600">
                                      <option>Toyota</option>
                                    </select>
                                    <select className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600">
                                      <option>Prius</option>
                                    </select>
                                    <input
                                      className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                                      placeholder="VIN (Optional)"
                                      value="123456789109876"
                                      readOnly
                                    />
                                  </div>
                                  <Button className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold py-3 rounded-lg flex items-center justify-center">
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                  </Button>
                                </>
                              )}

                              {step.step === 3 && (
                                <>
                                  <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                      Dealer Portal
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                      Manage your deliveries and track driver
                                      assignments
                                    </p>
                                  </div>
                                  <div className="flex justify-between mb-6 bg-gray-800 rounded-lg p-1">
                                    {[
                                      {
                                        label: "Profile",
                                        active: true,
                                        count: null,
                                      },
                                      {
                                        label: "Pending",
                                        active: false,
                                        count: 2,
                                      },
                                      {
                                        label: "Assigned",
                                        active: false,
                                        count: null,
                                      },
                                      {
                                        label: "Done",
                                        active: false,
                                        count: null,
                                      },
                                    ].map((tab, i) => (
                                      <div
                                        key={i}
                                        className={`px-3 py-2 rounded-md text-sm font-medium relative ${tab.active ? "bg-[#E11900] text-white" : "text-gray-400"}`}
                                      >
                                        {tab.label}
                                        {tab.count && (
                                          <span className="ml-1 bg-[#E11900] text-white text-xs rounded-full px-1">
                                            {tab.count}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <Button className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold py-3 rounded-lg mb-6">
                                    + Request Driver
                                  </Button>
                                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center relative">
                                      <span className="text-white text-xl font-bold">
                                        JS
                                      </span>
                                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#E11900] rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-white" />
                                      </div>
                                    </div>
                                    <div className="text-yellow-400 mb-2">
                                      ⭐
                                    </div>
                                    <h3 className="text-white font-bold text-lg">
                                      John Smith
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                      Smith Toyota
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                      Sales Consultant
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                      📅 Member since 9/28/2025
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Screenshot Gallery Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See SwapRunn in <span className="text-[#E11900]">Action</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Real screenshots from our platform showing the actual user
              experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Dashboard Screenshot */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src="/dashboard-preview.png"
                    alt="Dealer Dashboard Overview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">
                      Dealer Dashboard
                    </h3>
                    <p className="text-white/80 text-sm">
                      Complete overview of all your delivery requests
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile App Screenshot Placeholder */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <Phone className="h-12 w-12 text-[#E11900] mx-auto mb-2" />
                      <p className="text-white font-medium">
                        Mobile App Interface
                      </p>
                      <p className="text-white/60 text-sm">Coming Soon</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">
                      Mobile Experience
                    </h3>
                    <p className="text-white/80 text-sm">
                      Native iOS and Android applications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Workflow Screenshot Placeholder */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-[#E11900] mx-auto mb-2" />
                      <p className="text-white font-medium">Driver Portal</p>
                      <p className="text-white/60 text-sm">In Development</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">
                      Driver Interface
                    </h3>
                    <p className="text-white/80 text-sm">
                      Job acceptance and tracking system
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Screenshots CTA */}
          <div className="text-center">
            <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-700/40 shadow-lg rounded-2xl max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Calendar className="h-6 w-6 text-[#E11900]" />
                  <h3 className="text-xl font-bold text-white">
                    More Screenshots Coming
                  </h3>
                </div>
                <p className="text-white/70">
                  {
                    "We're continuously updating this page with new screenshots as we add features."
                  }
                  <br />
                  {"Check back soon to see the latest updates to our platform."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coming Soon - Driver Side */}
        <div className="text-center mb-16">
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-lg rounded-2xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Clock className="h-16 w-16 text-[#E11900] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Driver Experience Coming Soon
              </h3>
              <p className="text-white/70 text-lg mb-6">
                {
                  "We're adding the driver workflow next - showing how professional drivers receive, accept, and complete deliveries."
                }
              </p>
              <p className="text-white/50 text-sm">
                Professional drivers will see dedicated sections for job
                discovery, acceptance, and completion tracking.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#E11900]/20 to-[#E11900]/10 backdrop-blur-sm border-[#E11900]/30 shadow-2xl rounded-2xl max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Streamline Your Deliveries?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join hundreds of dealerships using SwapRunn for faster, more
                reliable vehicle delivery services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dealer/auth">
                  <Button className="bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started as Dealer
                  </Button>
                </Link>
                <Link to="/driver/auth">
                  <Button
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Join as Driver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="relative z-10 py-12 mt-16 border-t border-white/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <span className="text-white/60 text-lg font-medium">
                  © 2025 SwapRunn
                </span>
                <span className="text-white/30 text-sm ml-3">
                  Dealership Logistics Platform
                </span>
              </div>

              <div className="flex gap-8">
                <Link
                  to="/privacy"
                  className="text-white/60 hover:text-white transition-colors font-medium"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-white/60 hover:text-white transition-colors font-medium"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/contact"
                  className="text-white/60 hover:text-white transition-colors font-medium"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HowItWorks;
