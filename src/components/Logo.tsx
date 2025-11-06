import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface LogoProps {
  className?: string;
  size?: "homepage" | "dashboard" | "auth";
  showText?: boolean;
  showCar?: boolean;
  variant?: "card" | "plain";
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "dashboard",
  showText = true,
  showCar = false,
  variant = "card",
}) => {
  const { user, userProfile } = useAuth();
  const location = useLocation();

  // Determine the appropriate route based on user status
  const getLogoRoute = () => {
    if (!user) return "/";

    if (userProfile?.user_type === "dealer" || userProfile?.user_type === "staff") {
      return "/dealer/dashboard";
    } else if (userProfile?.user_type === "driver") {
      return "/driver/dashboard";
    } else if (userProfile?.user_type === "admin") {
      return "/dealer/admin";
    }

    return "/";
  };
  const sizeClasses = {
    homepage: { height: "h-24 md:h-28 lg:h-40", width: "w-auto" },
    dashboard: { height: "h-10", width: "w-auto" },
    auth: { height: "h-20", width: "w-auto" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Link
        to={getLogoRoute()}
        className="group transition-all duration-300 hover:scale-105"
        aria-label="SwapRunn home"
      >
        <img
          src="/swaprunn-logo-2025.png?v=20251001"
          alt="SwapRunn Logo"
          className={`${currentSize.height} ${currentSize.width} drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-xl`}
          loading="lazy"
        />
      </Link>
    </div>
  );
};

export default Logo;
