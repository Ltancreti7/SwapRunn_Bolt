import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";

const WebHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/swaprunn-logo-2025.png?v=20251001"
            alt="SwapRunn"
            className="h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to={
                  user.user_metadata?.role === "dealer"
                    ? "/dealer/dashboard"
                    : "/driver/dashboard"
                }
              >
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/dealer/signin">
                <Button variant="ghost">Dealer Login</Button>
              </Link>
              <Link to="/driver/auth">
                <Button variant="default">Driver Login</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default WebHeader;
