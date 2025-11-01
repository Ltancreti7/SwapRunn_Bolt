import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  driverName?: string;
  onRatingSubmitted?: () => void;
}

const ratingCategories = [
  {
    key: "on_time_delivery",
    label: "On-Time Delivery",
    description: "Driver arrived and completed delivery on schedule",
  },
  {
    key: "communication_quality",
    label: "Communication",
    description: "Professional and responsive communication",
  },
  {
    key: "professionalism",
    label: "Professionalism",
    description: "Courteous and professional behavior",
  },
  {
    key: "vehicle_condition",
    label: "Vehicle Condition",
    description: "Clean and well-maintained vehicle",
  },
];

export function RatingDialog({
  isOpen,
  onClose,
  assignmentId,
  driverName = "Driver",
  onRatingSubmitted,
}: RatingDialogProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStarClick = (category: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [category]: rating }));

    // Update overall rating as average of category ratings
    const newRatings = { ...ratings, [category]: rating };
    const validRatings = Object.values(newRatings).filter((r) => r > 0);
    if (validRatings.length > 0) {
      const avg =
        validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
      setOverallRating(Math.round(avg));
    }
  };

  const handleOverallStarClick = (rating: number) => {
    setOverallRating(rating);
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit overall rating
      const { error: ratingError } = await supabase.from("ratings").insert({
        assignment_id: assignmentId,
        stars: overallRating,
        comment: comment.trim() || null,
      });

      if (ratingError) throw ratingError;

      // Submit detailed category ratings
      if (Object.keys(ratings).length > 0) {
        const { data: assignment } = await supabase
          .from("assignments")
          .select("driver_id, job_id")
          .eq("id", assignmentId)
          .single();

        if (assignment) {
          const reputationMetrics = Object.entries(ratings).map(
            ([category, score]) => ({
              driver_id: assignment.driver_id,
              metric_type: category,
              score,
              job_id: assignment.job_id,
            }),
          );

          const { error: metricsError } = await supabase
            .from("reputation_metrics")
            .insert(reputationMetrics);

          if (metricsError) {
            console.error("Error inserting reputation metrics:", metricsError);
          }
        }
      }

      toast({
        title: "Rating Submitted",
        description: `Thank you for rating ${driverName}!`,
      });

      onRatingSubmitted?.();
      onClose();

      // Reset form
      setRatings({});
      setOverallRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: number,
    onStarClick: (rating: number) => void,
    size = "w-5 h-5",
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onStarClick(star)}
            className="transition-colors hover:scale-110"
          >
            <Star
              className={`${size} ${
                star <= currentRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {driverName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="text-center space-y-2">
            <Label className="text-base font-semibold">Overall Rating</Label>
            {renderStars(overallRating, handleOverallStarClick, "w-8 h-8")}
            <p className="text-sm text-muted-foreground">
              {overallRating === 0 && "Click to rate"}
              {overallRating === 1 && "Poor"}
              {overallRating === 2 && "Fair"}
              {overallRating === 3 && "Good"}
              {overallRating === 4 && "Very Good"}
              {overallRating === 5 && "Excellent"}
            </p>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Detailed Ratings (Optional)
            </Label>
            {ratingCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  {renderStars(ratings[category.key] || 0, (rating) =>
                    handleStarClick(category.key, rating),
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this driver..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || overallRating === 0}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
