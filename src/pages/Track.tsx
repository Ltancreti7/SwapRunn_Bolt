import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Phone,
} from "lucide-react";
import { supabaseService, Job } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import mapBackgroundImage from "@/assets/map-background.jpg";

const Track = () => {
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setLoading(false);
      return;
    }

    const sanitizedToken = token.trim();
    const tokenIsValid = /^[A-Za-z0-9-]{8,}$/.test(sanitizedToken);

    if (!tokenIsValid) {
      setInvalidToken(true);
      setLoading(false);
      return;
    }

    loadJob(sanitizedToken);
  }, [token]);

  const loadJob = async (trackingToken: string) => {
    try {
      const foundJob = await supabaseService.getJobByTrackingToken(
        trackingToken,
      );
      setJob(foundJob);
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Loading...
            </h1>
            <p className="text-text-secondary">
              Fetching your tracking information...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Invalid tracking link
            </h1>
            <p className="text-text-secondary">
              Double-check the link you received or request a new tracking link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Tracking Not Found
            </h1>
            <p className="text-text-secondary">
              {
                "The tracking link you're looking for doesn't exist or has expired."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case "open":
        return 1;
      case "assigned":
        return 2;
      case "in_progress":
        return 3;
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStep(job.status);

  const steps = [
    {
      number: 1,
      title: "Job Posted",
      description: "Your delivery request has been created",
      icon: Package,
    },
    {
      number: 2,
      title: "Driver Assigned",
      description: "A driver has accepted your job",
      icon: Truck,
    },
    {
      number: 3,
      title: "In Transit",
      description: "Driver is working on your delivery",
      icon: Clock,
    },
    {
      number: 4,
      title: "Completed",
      description: "Your delivery has been completed",
      icon: CheckCircle,
    },
  ];

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>

      <div className="relative z-10 container mx-auto px-4 pt-24 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-text-primary">
              Track Your {job.type}
            </h1>
            <p className="text-text-secondary">
              Tracking ID: {job.track_token}
            </p>
          </div>

          {/* Job Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Delivery Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <div className="font-semibold text-text-primary mb-1">
                    From
                  </div>
                  <div className="text-text-secondary">
                    {job.pickup_address}
                  </div>
                </div>
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <div className="font-semibold text-text-primary mb-1">To</div>
                  <div className="text-text-secondary">
                    {job.delivery_address}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-text-primary">
                    Customer
                  </div>
                  <div className="text-text-secondary">{job.customer_name}</div>
                </div>
                <div>
                  <div className="font-semibold text-text-primary">Type</div>
                  <div className="text-text-secondary">{job.type}</div>
                </div>
              </div>

              {job.vin && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-1">
                    Vehicle Information
                  </div>
                  <div className="text-blue-700">
                    {job.year} {job.make} {job.model}
                  </div>
                  <div className="text-blue-600 text-sm font-mono">
                    VIN: {job.vin}
                  </div>
                </div>
              )}

              {job.notes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-1">
                    Special Instructions
                  </div>
                  <div className="text-blue-700">{job.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = step.number <= currentStep;
                  const isCurrent = step.number === currentStep;

                  return (
                    <div
                      key={step.number}
                      className="flex items-start space-x-4"
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-primary text-white"
                            : "bg-surface-secondary border-2 border-border text-text-secondary"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <div
                          className={`font-semibold ${
                            isCompleted
                              ? "text-text-primary"
                              : "text-text-secondary"
                          }`}
                        >
                          {step.title}
                          {isCurrent && (
                            <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-text-secondary text-sm">
                          {step.description}
                        </div>

                        {/* Show timestamps for completed steps */}
                        {step.number === 1 && job.created_at && (
                          <div className="text-xs text-text-secondary mt-1">
                            {new Date(job.created_at).toLocaleString()}
                          </div>
                        )}
                        {step.number === 2 && job.accepted_at && (
                          <div className="text-xs text-text-secondary mt-1">
                            {new Date(job.accepted_at).toLocaleString()}
                          </div>
                        )}
                        {step.number === 3 && job.started_at && (
                          <div className="text-xs text-text-secondary mt-1">
                            {new Date(job.started_at).toLocaleString()}
                          </div>
                        )}
                        {step.number === 4 && job.ended_at && (
                          <div className="text-xs text-text-secondary mt-1">
                            {new Date(job.ended_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Driver Information */}
          {job.driver_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span>Your Driver</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {job.driver_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">
                      {job.driver_name}
                    </div>
                    <div className="text-text-secondary text-sm">
                      Professional Driver
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          <Card>
            <CardContent className="pt-6">
              {job.status === "open" && (
                <div className="text-center text-text-secondary">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>
                    {"We're finding the best driver for your "}
                    {job.type.toLowerCase()}...
                  </p>
                </div>
              )}
              {job.status === "assigned" && (
                <div className="text-center text-blue-600">
                  <Truck className="h-8 w-8 mx-auto mb-2" />
                  <p>
                    Your driver is preparing to start your{" "}
                    {job.type.toLowerCase()}.
                  </p>
                </div>
              )}
              {job.status === "in_progress" && (
                <div className="text-center text-orange-600">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Your {job.type.toLowerCase()} is currently in progress.</p>
                </div>
              )}
              {job.status === "completed" && (
                <div className="text-center text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>
                    Your {job.type.toLowerCase()} has been completed
                    successfully!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">
                {
                  "If you have any questions about your delivery, please don't hesitate to contact us."
                }
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-text-secondary" />
                  <span className="text-text-primary font-medium">
                    (555) SWAPRUNN
                  </span>
                </div>
                <div className="text-text-secondary text-sm">
                  Customer service available 24/7
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Track;
