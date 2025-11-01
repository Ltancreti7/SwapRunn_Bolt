import { Link, useLocation } from "react-router-dom";
import { Package, Clock, Users, History, CreditCard, Car } from "lucide-react";
import Logo from "./Logo";
import LogoHomeButton from "./LogoHomeButton";
import BackButton from "./BackButton";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navigation = [
    { name: "Jobs", href: "/jobs", icon: Package },
    { name: "History", href: "/history", icon: History },
    { name: "Drivers", href: "/drivers", icon: Users },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Driver Profile", href: "/driver-profile", icon: Car },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <BackButton />
      <LogoHomeButton />
      <nav className="border-b border-border bg-card shadow-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-4">
                <Logo size="dashboard" />
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                        location.pathname === item.href
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
