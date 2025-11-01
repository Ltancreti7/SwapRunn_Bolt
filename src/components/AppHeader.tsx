import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { NavigationDrawer } from "./NavigationDrawer";
import { MessagesButton } from "./messages/MessagesButton";
import { MessagesOverlay } from "./messages/MessagesOverlay";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showBounce, setShowBounce] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const { totalUnread } = useUnreadMessages();
  const { userProfile } = useAuth();

  // Determine if we should hide the header (but keep hooks consistent)
  const shouldHideHeader =
    location.pathname === "/" ||
    [
      "/drivers",
      "/how-it-works",
      "/dealership/register",
      "/swap-coordinator/dashboard",
    ].includes(location.pathname);

  // Top-level routes where back button should be hidden (show hamburger menu instead)
  const topLevelRoutes = [
    "/",
    "/drivers",
    "/dealer/dashboard",
    "/driver/dashboard",
  ];
  const shouldShowBack = !topLevelRoutes.includes(location.pathname);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const isScrolled = currentScrollY > 50;

          // Determine scroll direction and visibility
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            // Scrolling down - hide header
            setIsVisible(false);
            setShowBounce(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up - show header with bounce
            if (!isVisible) {
              setShowBounce(true);
              // Remove bounce class after animation completes
              setTimeout(() => setShowBounce(false), 500);
            }
            setIsVisible(true);
          }

          setScrolled(isScrolled);
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isVisible]);
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to related dashboard or home
      if (location.pathname.startsWith("/dealer")) {
        navigate("/dealer/dashboard");
      } else if (location.pathname.startsWith("/driver")) {
        navigate("/driver/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  // Hide AppHeader on pages with their own headers (after all hooks are called)
  if (shouldHideHeader) {
    return null;
  }
  return (
    <header
      className={cn(
        "fixed top-2 left-0 right-0 z-[60] border-b transition-all",
        scrolled
          ? "bg-[#1A1A1A]/95 backdrop-blur-lg border-white/20 shadow-2xl"
          : "bg-black/50 backdrop-blur-xl border-white/10 shadow-lg",
        !isVisible && "-translate-y-full",
        showBounce && "animate-header-bounce",
      )}
      style={{
        transitionDuration: "0.35s",
        transitionTimingFunction: "ease-out",
        transitionProperty:
          "transform, background-color, backdrop-filter, border-color, box-shadow",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 py-2">
        {/* Left: Back Button or Hamburger Menu - Only show if user is logged in */}
        <div className="flex items-center justify-center min-w-[48px] h-[48px]">
          {userProfile ? (
            shouldShowBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white shadow-lg border border-white/10 active:scale-95 transition-transform"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            ) : (
              <NavigationDrawer />
            )
          ) : (
            <div className="w-12 h-12" /> // Placeholder for alignment
          )}
        </div>

        {/* Center: Logo - Mobile optimized */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src="/swaprunn-logo-2025.png?v=20251001"
            alt="SwapRunn"
            className={cn(
              "w-auto transition-all duration-300 drop-shadow-lg",
              scrolled ? "h-8" : "h-10",
            )}
          />
        </div>

        {/* Right: Messages Button - Only show if user is logged in */}
        <div className="flex items-center justify-center min-w-[48px] h-[48px]">
          {userProfile ? (
            <MessagesButton
              onClick={() => setShowMessages(true)}
              unreadCount={totalUnread}
            />
          ) : (
            <div className="w-12 h-12" /> // Placeholder for alignment
          )}
        </div>
      </div>

      {/* Messages Overlay */}
      <MessagesOverlay
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        userType={userProfile?.user_type || "driver"}
        currentUserId={userProfile?.user_id || "guest"}
      />
    </header>
  );
}
