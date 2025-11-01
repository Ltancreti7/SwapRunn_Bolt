import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  X,
  Phone,
  Mail,
  User,
  FileText,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeCardProps {
  driverData: any;
  onDismiss: () => void;
  showTutorial: boolean;
}

export const WelcomeCard = ({
  driverData,
  onDismiss,
  showTutorial,
}: WelcomeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate profile completion
  const checklistItems = [
    {
      id: "profile",
      label: "Complete basic profile",
      completed: !!(driverData?.name && driverData?.email),
      icon: User,
      description: "Add your name and contact information",
    },
    {
      id: "phone",
      label: "Add phone number",
      completed: !!driverData?.phone,
      icon: Phone,
      description: "Required for job notifications",
    },
    {
      id: "documents",
      label: "Upload required documents",
      completed: driverData?.checkr_status === "approved",
      icon: FileText,
      description: "License, insurance, and background check",
    },
    {
      id: "rating",
      label: "Maintain good rating",
      completed: (driverData?.rating_avg || 0) >= 4.5,
      icon: Star,
      description: "Keep a 4.5+ star rating from customers",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  const isNewDriver = completedCount < 3;

  if (!isNewDriver && !showTutorial) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {isNewDriver ? "Welcome to SwapRunn!" : "Tutorial Available"}
              </CardTitle>
              {isNewDriver && (
                <p className="text-sm text-muted-foreground mt-1">
                  Let's get you set up to start earning
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isNewDriver && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  {completedCount}/{totalCount} Complete
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(completionPercentage)}% done
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isNewDriver && (
          <div className="mt-3">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {isNewDriver && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Setup Checklist:</h4>
              {checklistItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {item.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          item.completed
                            ? "text-green-700 line-through"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link to="/driver/requests" className="flex-1">
              <Button className="w-full" size="sm">
                {isNewDriver ? "View Available Jobs" : "Start Tutorial"}
              </Button>
            </Link>
            {isNewDriver && (
              <Link to="/driver-profile" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Complete Profile
                </Button>
              </Link>
            )}
          </div>

          {isNewDriver && completedCount === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div className="text-sm text-blue-800">
                  <strong>Pro tip:</strong> Complete your profile and upload
                  documents to start receiving job offers immediately!
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
