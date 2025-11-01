import {
  Shield,
  Mail,
  Phone,
  FileCheck,
  User,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgesProps {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  backgroundCheckVerified?: boolean;
  profileCompletionPercentage?: number;
  trustScore?: number;
  className?: string;
}

export function DriverVerificationBadges({
  emailVerified = false,
  phoneVerified = false,
  backgroundCheckVerified = false,
  profileCompletionPercentage = 0,
  trustScore = 5.0,
  className = "",
}: VerificationBadgesProps) {
  const verifications = [
    {
      label: "Email Verified",
      verified: emailVerified,
      icon: Mail,
      color: emailVerified
        ? "bg-green-500/10 text-green-600 border-green-500/20"
        : "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
    {
      label: "Phone Verified",
      verified: phoneVerified,
      icon: Phone,
      color: phoneVerified
        ? "bg-green-500/10 text-green-600 border-green-500/20"
        : "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
    {
      label: "Background Check",
      verified: backgroundCheckVerified,
      icon: Shield,
      color: backgroundCheckVerified
        ? "bg-green-500/10 text-green-600 border-green-500/20"
        : "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
  ];

  const getTrustScoreColor = (score: number) => {
    if (score >= 4.5)
      return "bg-green-500/10 text-green-600 border-green-500/20";
    if (score >= 3.5)
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  const getProfileCompletionColor = (percentage: number) => {
    if (percentage >= 90)
      return "bg-green-500/10 text-green-600 border-green-500/20";
    if (percentage >= 70)
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {/* Trust Score Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-2 py-1 text-xs ${getTrustScoreColor(trustScore)}`}
            >
              <CheckCircle className="w-3 h-3" />
              {trustScore.toFixed(1)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trust Score: {trustScore.toFixed(1)}/5.0</p>
          </TooltipContent>
        </Tooltip>

        {/* Profile Completion Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-2 py-1 text-xs ${getProfileCompletionColor(profileCompletionPercentage)}`}
            >
              <User className="w-3 h-3" />
              {profileCompletionPercentage}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profile Completion: {profileCompletionPercentage}%</p>
          </TooltipContent>
        </Tooltip>

        {/* Verification Badges */}
        {verifications.map((verification) => (
          <Tooltip key={verification.label}>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 text-xs ${verification.color}`}
              >
                <verification.icon className="w-3 h-3" />
                {verification.verified && <CheckCircle className="w-2 h-2" />}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {verification.label}:{" "}
                {verification.verified ? "Verified" : "Not Verified"}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
