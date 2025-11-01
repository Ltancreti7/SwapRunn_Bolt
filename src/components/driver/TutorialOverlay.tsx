import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string;
  action?: string;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Your Dashboard",
    description:
      "This is your command center where you'll manage all your delivery jobs and track your earnings.",
    highlight: "dashboard-container",
  },
  {
    title: "Check for New Jobs",
    description:
      "Click 'View Requests' to see available delivery jobs in your area. You'll get notifications when new jobs are posted.",
    action: "Look for the red notification badge!",
  },
  {
    title: "Accept Jobs Quickly",
    description:
      "When a new job alert appears, you can accept it directly or view details first. Fast responses increase your job acceptance rate.",
    highlight: "job-alert",
  },
  {
    title: "Track Your Progress",
    description:
      "Monitor your current jobs, earnings, and completion history. All your job information is organized here.",
    highlight: "jobs-section",
  },
  {
    title: "Stay Connected",
    description:
      "Use the chat feature to communicate with dealers and customers during deliveries. Clear communication leads to better ratings!",
  },
];

export const TutorialOverlay = ({ isOpen, onClose }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const currentTutorialStep = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold">Quick Tutorial</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <div className="flex gap-1">
                {tutorialSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      index === currentStep ? "bg-primary" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{currentTutorialStep.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTutorialStep.description}
              </p>
            </div>

            {currentTutorialStep.action && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">💡</span>
                  <span className="text-sm text-blue-800 font-medium">
                    {currentTutorialStep.action}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button onClick={handleNext} className="flex items-center gap-2">
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Skip tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
