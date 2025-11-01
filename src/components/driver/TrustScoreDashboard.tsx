import { useState, useEffect } from "react";
import { TrendingUp, Award, Shield, Star, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface TrustScoreDashboardProps {
  driverId: string;
}

interface TrustMetrics {
  trustScore: number;
  profileCompletion: number;
  totalRatings: number;
  averageRating: number;
  recentMetrics: Array<{
    metric_type: string;
    score: number;
    recorded_at: string;
  }>;
  verifications: {
    email_verified: boolean;
    phone_verified: boolean;
    background_check_verified: boolean;
  };
}

export function TrustScoreDashboard({ driverId }: TrustScoreDashboardProps) {
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustMetrics();
  }, [driverId]);

  const loadTrustMetrics = async () => {
    try {
      setLoading(true);

      // Get driver basic info and trust metrics
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select(
          `
          trust_score,
          profile_completion_percentage,
          email_verified,
          phone_verified,
          background_check_verified,
          rating_avg,
          rating_count
        `,
        )
        .eq("id", driverId)
        .single();

      if (driverError) throw driverError;

      // Get recent reputation metrics
      const { data: reputationData, error: reputationError } = await supabase
        .from("reputation_metrics")
        .select("metric_type, score, recorded_at")
        .eq("driver_id", driverId)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (reputationError) throw reputationError;

      setMetrics({
        trustScore: driver?.trust_score || 5.0,
        profileCompletion: driver?.profile_completion_percentage || 0,
        totalRatings: driver?.rating_count || 0,
        averageRating: driver?.rating_avg || 5.0,
        recentMetrics: reputationData || [],
        verifications: {
          email_verified: driver?.email_verified || false,
          phone_verified: driver?.phone_verified || false,
          background_check_verified: driver?.background_check_verified || false,
        },
      });
    } catch (error) {
      console.error("Error loading trust metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevel = (score: number) => {
    if (score >= 4.5) return { label: "Excellent", color: "bg-green-500" };
    if (score >= 4.0) return { label: "Very Good", color: "bg-blue-500" };
    if (score >= 3.5) return { label: "Good", color: "bg-yellow-500" };
    if (score >= 3.0) return { label: "Fair", color: "bg-orange-500" };
    return { label: "Needs Improvement", color: "bg-red-500" };
  };

  const getMetricsByCategory = () => {
    if (!metrics) return {};

    const categories = {
      on_time_delivery: "On-Time Delivery",
      communication_quality: "Communication",
      professionalism: "Professionalism",
      vehicle_condition: "Vehicle Condition",
      customer_satisfaction: "Customer Satisfaction",
    };

    const metricsByCategory: Record<string, number[]> = {};

    metrics.recentMetrics.forEach((metric) => {
      if (!metricsByCategory[metric.metric_type]) {
        metricsByCategory[metric.metric_type] = [];
      }
      metricsByCategory[metric.metric_type].push(metric.score);
    });

    return Object.entries(metricsByCategory).map(([key, scores]) => ({
      category: categories[key as keyof typeof categories] || key,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      count: scores.length,
    }));
  };

  const verificationCount = metrics
    ? Object.values(metrics.verifications).filter(Boolean).length
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load trust metrics</p>
        </CardContent>
      </Card>
    );
  }

  const trustLevel = getTrustLevel(metrics.trustScore);
  const categoryMetrics = getMetricsByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Trust & Reputation Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Trust Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Trust Score
                      </p>
                      <p className="text-2xl font-bold">
                        {metrics.trustScore.toFixed(1)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`${trustLevel.color} text-white`}
                      >
                        {trustLevel.label}
                      </Badge>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Average Rating
                      </p>
                      <p className="text-2xl font-bold flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        {metrics.averageRating.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metrics.totalRatings} reviews
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Completion */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Profile Completion</p>
                    <p className="text-sm text-muted-foreground">
                      {metrics.profileCompletion}%
                    </p>
                  </div>
                  <Progress value={metrics.profileCompletion} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Complete your profile to increase trust score
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {Array.isArray(categoryMetrics) && categoryMetrics.length > 0 ? (
              <div className="space-y-3">
                {categoryMetrics.map((metric) => (
                  <Card key={metric.category}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{metric.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {metric.count} recent ratings
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {metric.average.toFixed(1)}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= metric.average
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No detailed metrics available yet. Complete more deliveries
                    to see your performance breakdown.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <div className="grid gap-3">
              {Object.entries(metrics.verifications).map(([key, verified]) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">
                        {key
                          .replace("_", " ")
                          .replace("verified", "Verification")}
                      </p>
                      <Badge variant={verified ? "default" : "secondary"}>
                        {verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  <strong>Trust Tip:</strong> Complete all verifications to
                  maximize your trust score and get priority access to
                  high-value deliveries.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
