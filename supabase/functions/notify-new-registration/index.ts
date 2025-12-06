import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationNotification {
  userEmail: string;
  userType: 'client' | 'partner';
  firstName?: string;
  lastName?: string;
  university?: string;
  businessName?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "admin@studentslife.es";

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-new-registration: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      console.log("notify-new-registration: RESEND_API_KEY not configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped - no email provider configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: RegistrationNotification = await req.json();
    console.log("notify-new-registration: Processing notification for:", body.userEmail, "Type:", body.userType);

    const isPartner = body.userType === 'partner';
    const userName = isPartner 
      ? body.businessName 
      : `${body.firstName || ''} ${body.lastName || ''}`.trim();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuovo Utente Registrato</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nuovo ${isPartner ? 'Partner' : 'Cliente'} Registrato</h1>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Un nuovo ${isPartner ? 'partner' : 'cliente'} si è registrato su StudentsLife:
            </p>
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                <strong style="color: #374151;">Nome:</strong> ${userName || 'Non specificato'}
              </p>
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                <strong style="color: #374151;">Email:</strong> ${body.userEmail}
              </p>
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                <strong style="color: #374151;">Tipo:</strong> ${isPartner ? 'Partner' : 'Cliente'}
              </p>
              ${body.university ? `
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong style="color: #374151;">Università:</strong> ${body.university}
              </p>
              ` : ''}
            </div>
            
            ${isPartner ? `
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              ⚠️ Questo partner è in attesa di approvazione. Accedi al pannello admin per approvare o rifiutare la richiesta.
            </p>
            ` : ''}
            
            <a href="https://studentslife.es/#/admin" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Vai al Pannello Admin
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            StudentsLife - La community degli studenti
          </p>
        </div>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StudentsLife <noreply@studentslife.es>",
        to: [ADMIN_EMAIL],
        subject: `🆕 Nuovo ${isPartner ? 'Partner' : 'Cliente'}: ${userName || body.userEmail}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    
    if (!resendResponse.ok) {
      console.error("notify-new-registration: Resend API error:", resendData);
      // Don't fail the registration, just log the error
      return new Response(
        JSON.stringify({ success: true, message: "Registration successful, notification failed", error: resendData }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("notify-new-registration: Email sent successfully:", resendData);
    return new Response(
      JSON.stringify({ success: true, message: "Notification sent", emailId: resendData.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("notify-new-registration: Error:", errorMessage);
    // Return success anyway to not block registration
    return new Response(
      JSON.stringify({ success: true, message: "Registration successful, notification error", error: errorMessage }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
