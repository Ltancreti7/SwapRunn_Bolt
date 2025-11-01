import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  useEffect(() => {
    // Preload background image with optimization
    const img = new Image();
    img.src = mapBackgroundImage;

    // Set lower quality for faster loading
    img.loading = "eager";

    img.onload = () => {
      setIsImageLoaded(true);
      // Delay form rendering slightly to ensure smooth transition
      requestAnimationFrame(() => {
        setIsFormReady(true);
      });
    };

    img.onerror = () => {
      setIsImageLoaded(true); // Still show page even if image fails
      setIsFormReady(true);
    };

    // Ensure component is ready
    setIsPageReady(true);
  }, []);

  const validateEmail = (email: string) => {
    // More robust email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleEmailBlur = () => {
    if (formData.email.trim() && !validateEmail(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; email?: string; message?: string } = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate email - check if empty first, then check format
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    // Prevent submission if any errors exist
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create mailto link using anchor element to avoid navigation issues
    try {
      // Log to Supabase in background (doesn't block user experience)
      void supabase
        .from("form_submissions")
        .insert({
          form_type: "contact",
          name: formData.name,
          email: formData.email,
          message: formData.message,
          status: "success",
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to log form submission:", error);
          } else {
            console.log("Form submission logged successfully");
          }
        });

      const subject = encodeURIComponent(`Contact Form: ${formData.name}`);
      const body = encodeURIComponent(
        `From: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
      );
      const mailtoLink = `mailto:support@swaprunn.com?subject=${subject}&body=${body}`;

      const anchor = document.createElement("a");
      anchor.href = mailtoLink;
      anchor.target = "_blank";
      anchor.click();

      setSubmitted(true);
      setSubmitError("");
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitError(
        "There was an issue sending your message. Please try again later.",
      );
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Show optimized loader while page initializes
  if (!isPageReady || !isFormReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#E11900] mx-auto" />
          <p className="text-white/70 text-sm">Loading contact form...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative bg-black animate-fade-in"
      style={{
        backgroundImage: isImageLoaded ? `url(${mapBackgroundImage})` : "none",
        backgroundColor: "#000",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        transition: "background-image 0.3s ease-in-out",
        willChange: "background-image",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/40 z-0"></div>

      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center animate-fade-in">
            Get in Touch
          </h1>
          <p
            className="text-white/70 text-center mb-8 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            Have questions? We&apos;d love to hear from you.
          </p>

          {submitted ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 animate-scale-in">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  ✅ Message sent!
                </h2>
                <p className="text-green-400 text-lg font-semibold mb-2">
                  We&apos;ll reply within 24 hours.
                </p>
                <p className="text-white/70 mb-6">
                  Your message has been sent to support@swaprunn.com
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#E11900] hover:bg-[#E11900]/90 text-white"
                >
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card
              className="bg-white border-gray-200 shadow-lg animate-scale-in"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader>
                <CardTitle className="text-gray-900">Contact Form</CardTitle>
              </CardHeader>
              <CardContent>
                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{submitError}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "300ms" }}
                  >
                    <Label htmlFor="name" className="text-gray-900 font-medium">
                      Name <span className="text-[#E11900]">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter name…"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-12 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20 transition-all"
                      autoComplete="name"
                    />
                    {errors.name && (
                      <p className="text-[#E11900] text-sm mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "350ms" }}
                  >
                    <Label
                      htmlFor="email"
                      className="text-gray-900 font-medium"
                    >
                      Email <span className="text-[#E11900]">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email…"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={handleEmailBlur}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-12 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20 transition-all"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-[#E11900] text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "400ms" }}
                  >
                    <Label
                      htmlFor="message"
                      className="text-gray-900 font-medium"
                    >
                      Message <span className="text-[#E11900]">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your message…"
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      rows={6}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20 transition-all resize-none"
                    />
                    {errors.message && (
                      <p className="text-[#E11900] text-sm mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "450ms" }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-[#E11900] hover:bg-[#B51400] text-white h-12 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all hover-scale"
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
