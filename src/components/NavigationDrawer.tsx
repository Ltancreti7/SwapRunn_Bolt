import {
  Menu,
  X,
  Home,
  Users,
  Building2,
  Info,
  Mail,
  LayoutDashboard,
  FileText,
  Settings,
  CreditCard,
  UserPlus,
  LogOut,
  HelpCircle,
  Navigation,
  History,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function NavigationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate("/");
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Determine menu items based on user role
  const getMenuItems = () => {
    if (!user) {
      // Public visitors
      return [
        { to: "/", label: "Home", icon: Home },
        { to: "/drivers", label: "Drivers", icon: Users },
        { to: "/dealership/register", label: "Dealers", icon: Building2 },
        { to: "/how-it-works", label: "How It Works", icon: Info },
        { to: "/why-us", label: "Why Us", icon: Info },
        { to: "/contact", label: "Contact", icon: Mail },
      ];
    }

    const isDealer = userProfile?.dealers || userProfile?.role === "dealer";

    if (isDealer) {
      // Dealer menu
      return [
        { to: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/dealer/create-job", label: "Create Job", icon: FileText },
        { to: "/dealer/settings", label: "Settings", icon: Settings },
        { to: "/billing", label: "Billing", icon: CreditCard },
        { to: "/staff/signup", label: "Manage Staff", icon: UserPlus },
        { to: "/contact", label: "Help", icon: HelpCircle },
      ];
    } else {
      // Driver menu
      return [
        { to: "/driver/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/driver/requests", label: "My Jobs", icon: FileText },
        { to: "/driver/open-drives", label: "Open Drives", icon: Navigation },
        { to: "/driver/past-drives", label: "Past Drives", icon: History },
        { to: "/contact", label: "Help", icon: HelpCircle },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-200 active:scale-95 shadow-lg border border-white/10"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <div className="relative w-5 h-5">
          {/* Animated hamburger to X */}
          <span
            className={cn(
              "absolute left-0 w-5 h-0.5 bg-white transition-all duration-300 ease-out",
              isOpen ? "top-1/2 rotate-45 -translate-y-1/2" : "top-1",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1/2 w-5 h-0.5 bg-white transition-all duration-300 ease-out -translate-y-1/2",
              isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100",
            )}
          />
          <span
            className={cn(
              "absolute left-0 w-5 h-0.5 bg-white transition-all duration-300 ease-out",
              isOpen ? "top-1/2 -rotate-45 -translate-y-1/2" : "bottom-1",
            )}
          />
        </div>
      </Button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-[70] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#1A1A1A] border-r border-white/10 z-[80] transition-transform duration-300 ease-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full pt-safe">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <img
              src="/swaprunn-logo-2025.png?v=20251001"
              alt="SwapRunn"
              className="h-8 w-auto"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95",
                        active
                          ? "bg-[#E11900] text-white shadow-lg"
                          : "text-white/70 hover:text-white hover:bg-white/10",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button (if authenticated) */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
