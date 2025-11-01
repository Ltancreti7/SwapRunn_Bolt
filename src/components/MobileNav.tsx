import { ArrowLeft, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  className?: string;
}

const MobileNav = ({ className }: MobileNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Pages where we should NOT show Back button
  const hideBackOnPages = ["/", "/404"];
  const shouldShowBack = !hideBackOnPages.includes(location.pathname);

  // Pages where we should show Logout (authenticated pages only)
  const authPages = [
    "/driver/dashboard",
    "/dealer/dashboard",
    "/dealer/admin",
    "/dealer/settings",
    "/driver/profile",
    "/driver/requests",
    "/driver/jobs",
    "/staff/signup",
  ];
  const isAuthPage = authPages.some((page) =>
    location.pathname.startsWith(page),
  );
  const shouldShowLogout = user && isAuthPage;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Don't render if no buttons to show
  if (!shouldShowBack && !shouldShowLogout) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-2 left-0 right-0 z-[60] bg-black/40 backdrop-blur-md border-b border-white/10",
        "flex items-center justify-between px-4 py-2",
        "lg:bg-transparent lg:backdrop-blur-none lg:border-0",
        className,
      )}
    >
      {/* Back Button */}
      {shouldShowBack ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white lg:h-10 lg:w-10"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : (
        <div className="h-11 w-11" /> // Spacer for alignment
      )}

      {/* Logout Button */}
      {shouldShowLogout ? (
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="h-11 px-4 rounded-full bg-[#E11900]/90 hover:bg-[#E11900] text-white font-semibold lg:h-10"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </Button>
      ) : (
        <div className="h-11 w-11" /> // Spacer for alignment
      )}
    </div>
  );
};

export default MobileNav;
