import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StaffInvitationRequest {
  email: string;
  role: string;
  dealershipName: string;
  inviterName: string;
  inviteToken: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      role,
      dealershipName,
      inviterName,
      inviteToken,
    }: StaffInvitationRequest = await req.json();

    const inviteLink = `${req.headers.get("origin") || "https://swaprunn.lovable.app"}/accept-invitation/${inviteToken}`;

    const emailResponse = await resend.emails.send({
      from: "SwapRunn <noreply@swaprunn.com>",
      to: [email],
      subject: `You're invited to join ${dealershipName} on SwapRunn`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${dealershipName} on SwapRunn</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #dc2626; border-radius: 50%; margin-bottom: 16px;">
                  <svg style="color: white; width: 32px; height: 32px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">
                  You're invited to join ${dealershipName}
                </h1>
                <p style="font-size: 16px; color: #6b7280; margin: 0;">
                  ${inviterName} has invited you to join their dealership team on SwapRunn
                </p>
              </div>

              <!-- Role Badge -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                  Your Role:
                </div>
                <div style="font-size: 16px; font-weight: 500; color: #1f2937; text-transform: capitalize;">
                  ${role}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a 
                  href="${inviteLink}"
                  style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;"
                >
                  Accept Invitation
                </a>
              </div>

              <!-- What this means -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
                  <strong>What this means:</strong>
                </p>
                <ul style="font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px;">
                  <li>You'll have access to ${dealershipName}'s SwapRunn dashboard</li>
                  <li>You can ${role === "manager" ? "manage jobs and invite other staff" : "view and work with vehicle delivery jobs"}</li>
                  <li>Your activity will be tracked under the ${dealershipName} account</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 8px 0 0 0;">
                  Or copy and paste this link: ${inviteLink}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Staff invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-staff-invitation function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
