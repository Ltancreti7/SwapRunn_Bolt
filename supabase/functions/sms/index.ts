import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioMessagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return new Response("Missing to or body", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!twilioSid || !twilioToken || !twilioMessagingServiceSid) {
      console.log("TEST MODE: Would send SMS to", to, "with body:", body);
      return new Response(
        JSON.stringify({
          success: true,
          testMode: true,
          message: "SMS would be sent in production",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send real SMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          Body: body,
          MessagingServiceSid: twilioMessagingServiceSid,
        }),
      },
    );

    const result = await response.json();

    if (response.ok) {
      console.log("SMS sent successfully", { sid: result.sid });
      return new Response(
        JSON.stringify({
          success: true,
          message_sid: result.sid,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      console.error("Twilio error", {
        status: response.status,
        code: result?.code,
        message: result?.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("SMS error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
