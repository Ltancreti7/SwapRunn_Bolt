import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlasmicRootProvider } from "@plasmicapp/loader-react";
import { PLASMIC } from "./plasmic-init";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import PlasmicCatchAll from "./pages/PlasmicCatchAll";

import DriverDashboard from "./pages/DriverDashboard";
import Track from "./pages/Track";
import DealerSignin from "./pages/DealerSignin";
import DealerDashboard from "./pages/DealerDashboard";
import DealerAdminDashboard from "./pages/DealerAdminDashboard";
// Removed old DealerRequest - using unified CreateJob instead
import CreateJob from "./pages/CreateJob";
import DealerSettings from "./pages/DealerSettings";
import AcceptInvitation from "./pages/AcceptInvitation";
import StaffSignup from "./pages/StaffSignup";
import DriverRequests from "./pages/DriverRequests";
import DriverAuth from "./pages/DriverAuth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import DealershipRegistration from "./pages/DealershipRegistration";
import BillingSettings from "./pages/BillingSettings";
import Login from "./pages/Login";
import PasswordResetRequest from "./pages/PasswordResetRequest";
import PasswordUpdate from "./pages/PasswordUpdate";
import EmployeesPage from "./pages/dealer/employees";

import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { MobileApp } from "@/components/MobileApp";
import { Header } from "@/components/Header";
import DevRoutesIndex from "./pages/DevRoutesIndex";

const queryClient = new QueryClient();

const App = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const safeMode = params.has('safe');
  const minimalMode = params.has('minimal');

  if (safeMode) {
    return (
      <PlasmicRootProvider loader={PLASMIC}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MobileApp>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <div className="min-h-screen">
                    <Routes>
                      <Route path="*" element={<Index />} />
                    </Routes>
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </MobileApp>
          </AuthProvider>
        </QueryClientProvider>
      </PlasmicRootProvider>
    );
  }

  if (minimalMode) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Index />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
  <PlasmicRootProvider loader={PLASMIC}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileApp>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Header />
              <div className="min-h-screen">
                <Routes>
                {import.meta.env.DEV && (
                  <Route path="/__dev" element={<DevRoutesIndex />} />
                )}
                <Route path="/" element={<Index />} />
                <Route path="/plasmic-home" element={<Homepage />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dealers/registration"
                  element={<DealershipRegistration />}
                />
                <Route
                  path="/dealership/register"
                  element={<DealershipRegistration />}
                />
                <Route path="/billing" element={<BillingSettings />} />
                <Route path="/dealer/signin" element={<DealerSignin />} />
                {/* Legacy route redirect */}
                <Route path="/dealer/auth" element={<Navigate to="/dealer/signin" replace />} />
                <Route
                  path="/dealer/dashboard"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <DealerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dealer/admin"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <DealerAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dealer/create-job"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <CreateJob />
                    </ProtectedRoute>
                  }
                />
                {/* Legacy routes redirect to new unified form */}
                <Route
                  path="/dealer/request"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <CreateJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dealer/request-simple"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <CreateJob />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dealer/settings"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <DealerSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dealer/employees"
                  element={
                    <ProtectedRoute requiredUserType="dealer">
                      <EmployeesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accept-invitation/:token"
                  element={<AcceptInvitation />}
                />
                <Route path="/staff/signup" element={<StaffSignup />} />
                <Route path="/driver/auth" element={<DriverAuth />} />
                <Route path="/driver-auth" element={<DriverAuth />} />{" "}
                {/* Legacy alias */}
                <Route path="/auth/reset" element={<PasswordResetRequest />} />
                <Route
                  path="/auth/password-update"
                  element={<PasswordUpdate />}
                />
                <Route
                  path="/driver/requests"
                  element={
                    <ProtectedRoute requiredUserType="driver">
                      <DriverRequests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver/dashboard"
                  element={
                    <ProtectedRoute requiredUserType="driver">
                      <DriverDashboard />
                    </ProtectedRoute>
                  }
                />
                {/* Legacy driver job routes - redirect to requests */}
                <Route
                  path="/driver/job/:jobId"
                  element={<Navigate to="/driver/requests" replace />}
                />
                <Route
                  path="/driver/job-details/:jobId"
                  element={<Navigate to="/driver/requests" replace />}
                />
                <Route path="/track/:token" element={<Track />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                {/* Plasmic pages - add /plasmic/* routes here */}
                <Route path="/plasmic/*" element={<PlasmicCatchAll />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </MobileApp>
    </AuthProvider>
  </QueryClientProvider>
  </PlasmicRootProvider>
  );
};

export default App;
