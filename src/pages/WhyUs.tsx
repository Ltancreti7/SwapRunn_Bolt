import SiteHeader from "@/components/SiteHeader";
import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Star,
  Users,
} from "lucide-react";

const WhyUs = () => {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative"
      style={{
        backgroundImage: "url('/src/assets/map-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <main className="relative z-10 container mx-auto px-4 pt-24 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Why Choose SwapRunn?
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {
                "We're not just another logistics platform. We're your partner in delivering excellence, efficiency, and reliability in every swap."
              }
            </p>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-gray-300">
                  Average dispatch time of under 2 minutes. Get your deliveries
                  moving faster than ever.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Cost Effective</h3>
                <p className="text-gray-300">
                  Save up to 40% on delivery costs with our optimized routing
                  and driver network.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Fully Insured</h3>
                <p className="text-gray-300">
                  Complete coverage and protection for every delivery. Your
                  peace of mind is guaranteed.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Vetted Drivers</h3>
                <p className="text-gray-300">
                  All drivers undergo thorough background checks and vehicle
                  inspections.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">5-Star Service</h3>
                <p className="text-gray-300">
                  Consistently rated as the top choice by dealers nationwide for
                  reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">100% Tracked</h3>
                <p className="text-gray-300">
                  Real-time tracking and updates from pickup to delivery
                  completion.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Competitive Advantages */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              What Sets Us Apart
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-red-400">
                  Technology First
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>AI-powered route optimization</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Real-time GPS tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Automated dispatching system</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-red-400">
                  Dealer Focused
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Built specifically for car dealerships</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Integration with dealer management systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Custom reporting and analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Deliveries?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of dealers who trust SwapRunn for their vehicle
              delivery needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                Get Started Today
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhyUs;
