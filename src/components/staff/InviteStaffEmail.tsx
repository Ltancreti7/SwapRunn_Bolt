import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Crown, Shield, User } from "lucide-react";

interface InviteStaffEmailProps {
  inviterName: string;
  dealershipName: string;
  role: string;
  inviteLink: string;
}

export function InviteStaffEmail({
  inviterName,
  dealershipName,
  role,
  inviteLink,
}: InviteStaffEmailProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "manager":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
      }}
    >
      <div style={{ padding: "40px 20px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                backgroundColor: "#dc2626",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            >
              <Users
                style={{ color: "white", width: "32px", height: "32px" }}
              />
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 8px 0",
              }}
            >
              You&apos;re invited to join {dealershipName}
            </h1>
            <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
              {inviterName} has invited you to join their dealership team
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              {getRoleIcon(role)}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Your Role
              </span>
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#1f2937",
                textTransform: "capitalize",
              }}
            >
              {role}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <a
              href={inviteLink}
              style={{
                display: "inline-block",
                backgroundColor: "#dc2626",
                color: "white",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Accept Invitation
            </a>
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0 0 8px 0",
              }}
            >
              <strong>What this means:</strong>
            </p>
            <ul
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
                paddingLeft: "20px",
              }}
            >
              <li>
                You&apos;ll have access to {dealershipName}&apos;s SwapRunn
                dashboard
              </li>
              <li>
                You can{" "}
                {role === "manager"
                  ? "manage jobs and invite other staff"
                  : "view and work with vehicle delivery jobs"}
              </li>
              <li>
                Your activity will be tracked under the {dealershipName} account
              </li>
            </ul>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
              marginTop: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "center",
                margin: 0,
              }}
            >
              This invitation will expire in 7 days. If you didn&apos;t expect
              this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
