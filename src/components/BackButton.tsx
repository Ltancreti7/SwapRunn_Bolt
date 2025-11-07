import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show back button on homepage or 404
  const hideOnPages = ["/", "/404"];
  if (hideOnPages.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    // Smart navigation based on current page
    const currentPath = location.pathname;

    // Dealer request should go back to dealer dashboard
    if (currentPath.includes("/dealer/request") || currentPath.includes("/dealer/create-job")) {
      navigate("/dealer/dashboard");
      return;
    }

    // Auth pages should go back to home
    if (
      currentPath.includes("/auth") ||
      currentPath.includes("/dealer/auth") ||
      currentPath.includes("/driver/auth")
    ) {
      navigate("/");
      return;
    }

    // Registration pages should go back to home
    if (
      currentPath.includes("/registration") ||
      currentPath.includes("/dealership/register")
    ) {
      navigate("/");
      return;
    }

    // Password reset should go back to appropriate auth page
    if (currentPath.includes("/auth/reset")) {
      const referrer = document.referrer;
      if (referrer.includes("dealer")) {
        navigate("/dealer/auth");
      } else if (referrer.includes("driver")) {
        navigate("/driver/auth");
      } else {
        navigate("/");
      }
      return;
    }

    // Default behavior: try browser back, fallback to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className="fixed top-4 left-4 z-[60] h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white lg:h-10 lg:w-10 lg:bg-transparent lg:backdrop-blur-none"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};

export default BackButton;
