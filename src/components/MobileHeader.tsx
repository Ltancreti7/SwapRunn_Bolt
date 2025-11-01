import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const MobileHeader = () => {
  return (
    <div className="flex flex-col min-h-screen justify-between items-center px-6">
      {/* Top: logo */}
      <header className="pt-safe py-6">
        <img
          src="/swaprunn-logo-2025.png?v=20251001"
          alt="SwapRunn"
          className="h-14 w-auto"
        />
      </header>

      {/* Middle: buttons */}
      <main className="flex flex-col gap-4 w-full max-w-xs">
        <Link to="/dealer/auth" className="w-full">
          <Button className="w-full h-14 text-lg" size="lg">
            Dealer
          </Button>
        </Link>
        <Link to="/driver/auth" className="w-full">
          <Button className="w-full h-14 text-lg" size="lg" variant="outline">
            Driver
          </Button>
        </Link>
      </main>

      {/* Bottom spacer */}
      <div className="pb-safe py-6" />
    </div>
  );
};

export default MobileHeader;
