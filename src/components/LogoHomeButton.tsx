import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

const LogoHomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the appropriate home route based on current path
  const getHomeRoute = () => {
    if (location.pathname.startsWith("/dealer")) {
      return "/dealer/dashboard";
    } else if (location.pathname.startsWith("/driver")) {
      return "/driver/dashboard";
    } else {
      // For other logged-in pages, default to dealer dashboard
      return "/dealer/dashboard";
    }
  };

  const handleClick = () => {
    navigate(getHomeRoute());
  };

  return (
    <div className="mt-4 ml-4">
      <button
        onClick={handleClick}
        className="drop-shadow-sm hover:opacity-90 transition-opacity duration-200"
        aria-label="Go to dashboard"
      >
        <Logo size="dashboard" showText={true} />
      </button>
    </div>
  );
};

export default LogoHomeButton;
