import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  backTo?: string;
}

export function AuthHeader({
  title,
  subtitle,
  showBackButton = true,
  backTo = "/",
}: AuthHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-8">
      {showBackButton && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      )}

      <div className="mb-6">
        <Logo size="auth" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-white/80 text-sm max-w-md mx-auto">{subtitle}</p>
      </div>
    </div>
  );
}
