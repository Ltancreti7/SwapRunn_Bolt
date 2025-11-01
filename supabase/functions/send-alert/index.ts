import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  role: "driver" | "dealer";
  name: string;
  phone: string;
  timestamp: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { role, name, phone, timestamp }: AlertRequest = await req.json();

    console.log(`New ${role} application:`, { role, name, phone, timestamp });

    // Email to notify SwapRunn team about new application
    const emailResponse = await resend.emails.send({
      from: "SwapRunn Alerts <onboarding@resend.dev>",
      to: ["team@swaprunn.com"], // Replace with your actual notification email
      subject: `New ${role.charAt(0).toUpperCase() + role.slice(1)} Application - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E11900;">New ${role.charAt(0).toUpperCase() + role.slice(1)} Application</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Application Details:</h3>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              This is an automated notification from the SwapRunn application system.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Alert email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Alert sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error: any) {
    console.error("Error in send-alert function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send alert",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
