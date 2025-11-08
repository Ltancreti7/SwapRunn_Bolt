import { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from "../lib/logger";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Mail, Check, X, Users } from "lucide-react";
import mapBackgroundImage from "@/assets/map-background.jpg";
import type { Database } from "@/integrations/supabase/types";

type StaffInvitationRow =
  Database["public"]["Tables"]["staff_invitations"]["Row"];

interface StaffInvitation extends StaffInvitationRow {
  dealers: {
    name: string;
    store: string | null;
  };
}

interface AcceptStaffInvitationResponse {
  success: boolean;
  dealer_id?: string | null;
  error?: string | null;
}

const ALLOWED_PROFILE_TYPES = new Set(["dealer", "staff"]);

function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, userProfile, profileLoading, signOut } = useAuth();
  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    if (!token) {
      setError("This invitation link is invalid or has expired.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("staff_invitations")
        .select(
          `
          *,
          dealers!inner(name, store)
        `,
        )
        .eq("invite_token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setError(
            "This invitation is invalid, expired, or has already been used.",
          );
        } else {
          setError("Failed to load invitation details.");
        }
      } else {
        setInvitation(data as StaffInvitation);
      }
    } catch (error) {
      logger.error("Error fetching invitation:", error);
      setError("Failed to load invitation details.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [fetchInvitation, token]);

  const profileRole = userProfile?.user_type ?? null;
  const dealerIdFromProfile = userProfile?.dealer_id ?? null;
  const roleMismatch = Boolean(
    profileRole && !ALLOWED_PROFILE_TYPES.has(profileRole),
  );
  const dealerMismatch = Boolean(
    invitation &&
      dealerIdFromProfile &&
      dealerIdFromProfile !== invitation.dealer_id,
  );

  const eligibilityBlockReason = useMemo(() => {
    if (!invitation) return null;
    if (roleMismatch && profileRole) {
      return `This account is registered as ${profileRole}. Staff invitations can only be accepted with a dealer or staff account.`;
    }
    if (dealerMismatch && invitation.dealers?.name) {
      return `This account is already linked to a different dealership and cannot join ${invitation.dealers.name}.`;
    }
    if (dealerMismatch) {
      return "This account is already linked to a different dealership.";
    }
    return null;
  }, [dealerMismatch, invitation, profileRole, roleMismatch]);

  const normalizeEmail = (value?: string | null) =>
    typeof value === "string" ? value.trim().toLowerCase() : null;
  const isLoggedIn = Boolean(user);
  const invitationEmail = normalizeEmail(invitation?.email);
  const userEmail = normalizeEmail(user?.email ?? null);
  const emailMatches = Boolean(
    invitationEmail && userEmail && invitationEmail === userEmail,
  );
  const canAccept = Boolean(
    emailMatches && !profileLoading && !eligibilityBlockReason,
  );

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/dealer/signin");
  };

  const handleAcceptInvitation = async () => {
    if (!token || !user || !invitation) {
      toast({
        title: "Cannot accept invitation",
        description: "Please open the invitation link again and sign in.",
        variant: "destructive",
      });
      return;
    }

    if (profileLoading) {
      toast({
        title: "Profile still loading",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!canAccept) {
      toast({
        title: "Cannot accept invitation",
        description:
          eligibilityBlockReason ||
          "Please use the account that received this invitation.",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.rpc("accept_staff_invitation", {
        p_invite_token: token,
      });

      if (error) throw error;

      const response =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as unknown as AcceptStaffInvitationResponse)
          : null;

      if (response?.success) {
        toast({
          title: "Invitation accepted!",
          description: "Welcome to the team. Redirecting to dashboard...",
        });

        // Redirect to dealer dashboard after a short delay
        setTimeout(() => {
          navigate("/dealer/dashboard");
        }, 2000);
      } else {
        const message = response?.error || "Failed to accept invitation";
        toast({
          title: "Unable to accept invitation",
          description: message,
          variant: "destructive",
        });
      }
    } catch (caughtError) {
      logger.error("Error accepting invitation:", caughtError);
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to accept invitation";
      toast({
        title: "Unable to accept invitation",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

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
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-24">
          <div className="max-w-sm mx-auto p-8 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626] mx-auto"></div>
              <p className="mt-4 text-white/70">Loading invitation...</p>
            </div>
          </div>
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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-24">
        <div className="max-w-sm mx-auto p-8 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
          {error ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <h1 className="text-lg font-semibold text-white">
                  Invalid Invitation
                </h1>
              </div>
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
              <div className="text-center">
                <button
                  onClick={() => navigate("/")}
                  className="w-full border-2 border-white/20 text-white bg-white/10 backdrop-blur-sm py-3 rounded-full font-semibold transition hover:bg-white/20 active:scale-95 shadow-lg"
                >
                  Return Home
                </button>
              </div>
            </>
          ) : invitation ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 bg-[#DC2626]/20 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#DC2626]" />
                </div>
                <h1 className="text-lg font-semibold text-white">
                  Join {invitation.dealers.name}
                </h1>
                <p className="text-sm text-white/70 mt-2">
                  {"You've been invited to join the team"}
                </p>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Dealership:</span>
                  <span className="text-white font-medium">
                    {invitation.dealers.name}
                  </span>
                </div>
                {invitation.dealers.store && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Location:</span>
                    <span className="text-white font-medium">
                      {invitation.dealers.store}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/70">Role:</span>
                  <span className="text-white font-medium capitalize">
                    {invitation.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Email:</span>
                  <span className="text-white font-medium">
                    {invitation.email}
                  </span>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-200 text-sm">
                      Please sign in or create an account to accept this
                      invitation.
                    </p>
                  </div>
                </div>
              ) : !emailMatches ? (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-200 text-sm">
                      You must be signed in with the email address{" "}
                      {invitation.email} to accept this invitation.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleSwitchAccount}
                    className="mt-3 bg-white/10 text-white hover:bg-white/20"
                  >
                    Switch accounts
                  </Button>
                </div>
              ) : !profileLoading && eligibilityBlockReason ? (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-200 text-sm">
                      {eligibilityBlockReason}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleSwitchAccount}
                    className="mt-3 bg-white/10 text-white hover:bg-white/20"
                  >
                    Use a different account
                  </Button>
                </div>
              ) : null}

              <div className="space-y-3">
                {emailMatches ? (
                  <button
                    onClick={handleAcceptInvitation}
                    disabled={accepting || !canAccept}
                    className="w-full bg-[#DC2626] text-white py-3 rounded-full font-semibold transition hover:bg-[#b91c1c] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {accepting
                      ? "Accepting..."
                      : canAccept
                        ? "Accept Invitation"
                        : "Cannot accept invitation"}
                  </button>
                ) : null}

                {!isLoggedIn && (
                  <button
                    onClick={() => navigate("/dealer/signin")}
                    className="w-full bg-[#DC2626] text-white py-3 rounded-full font-semibold transition hover:bg-[#b91c1c] active:scale-95 shadow-lg"
                  >
                    Sign In to Accept
                  </button>
                )}

                <button
                  onClick={() => navigate("/")}
                  className="w-full border-2 border-white/20 text-white bg-white/10 backdrop-blur-sm py-3 rounded-full font-semibold transition hover:bg-white/20 active:scale-95 shadow-lg"
                >
                  Decline
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitation;
