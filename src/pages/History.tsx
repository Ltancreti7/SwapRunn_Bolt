import { useState, useEffect, useMemo } from "react";
import { CheckCircle, Calendar, Package, MapPin, User } from "lucide-react";
import { supabaseService, Job } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import mapBackgroundImage from "@/assets/map-background.jpg";

const History = () => {
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    loadCompletedJobs();
  }, []);

  const loadCompletedJobs = async () => {
    try {
      const jobs = await supabaseService.getCompletedJobs();
      setCompletedJobs(jobs);
    } catch (error) {
      console.error("Error loading completed jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleJobs = useMemo(
    () => completedJobs.slice(0, visibleCount),
    [completedJobs, visibleCount],
  );

  if (loading) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage: `url(${mapBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>
        <div className="relative z-10 flex items-center justify-center h-64 pt-24">
          <div className="text-white/70">Loading job history...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>
      <div className="relative z-10 max-w-7xl mx-auto pt-24 py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Job History
            </h1>
            <p className="text-text-secondary mt-1">
              View all completed delivery and swap jobs
            </p>
          </div>

          {/* Completed Jobs */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-text-primary">
                Completed Jobs ({completedJobs.length})
              </h2>
            </div>

            {completedJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    No Completed Jobs
                  </h3>
                  <p className="text-text-secondary">
                    Completed jobs will appear here once drivers finish their
                    deliveries.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {visibleJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-3">
                          <span className="text-lg">
                            {job.type} - {job.customer_name}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Completed</span>
                          </span>
                        </CardTitle>
                        <div className="text-sm text-text-secondary">
                          {job.ended_at
                            ? new Date(job.ended_at).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium text-text-primary">
                              Pickup:
                            </span>
                            <div className="text-text-secondary">
                              {job.pickup_address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <span className="font-medium text-text-primary">
                              Delivery:
                            </span>
                            <div className="text-text-secondary">
                              {job.delivery_address}
                            </div>
                          </div>
                        </div>
                      </div>

                      {job.vin && (
                        <div className="text-sm">
                          <span className="font-medium text-text-primary">
                            Vehicle:
                          </span>
                          <span className="text-text-secondary ml-1">
                            {job.year} {job.make} {job.model} (VIN: {job.vin})
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium text-text-primary">
                              Driver:
                            </span>
                            <span className="text-text-secondary ml-1">
                              {job.driver_name || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium text-text-primary">
                              Completed:
                            </span>
                            <span className="text-text-secondary ml-1">
                              {job.ended_at
                                ? new Date(job.ended_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {job.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-text-primary">
                            Notes:
                          </span>
                          <div className="text-text-secondary mt-1">
                            {job.notes}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-text-secondary pt-2 border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            Created:{" "}
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          {job.accepted_at && (
                            <div>
                              Accepted:{" "}
                              {new Date(job.accepted_at).toLocaleDateString()}
                            </div>
                          )}
                          {job.started_at && (
                            <div>
                              Started:{" "}
                              {new Date(job.started_at).toLocaleDateString()}
                            </div>
                          )}
                          {job.ended_at && (
                            <div>
                              Completed:{" "}
                              {new Date(job.ended_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {visibleJobs.length < completedJobs.length && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                  >
                    Load more
                  </Button>
                </div>
              )}
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
