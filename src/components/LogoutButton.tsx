import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Don't show if not authenticated or not on an auth page
  if (!user || !isAuthPage) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="fixed top-4 right-4 z-[60] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 lg:w-auto lg:px-4"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4 lg:mr-2" />
      <span className="hidden lg:inline">Logout</span>
    </Button>
  );
};

export default LogoutButton;
