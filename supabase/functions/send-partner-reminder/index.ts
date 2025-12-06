import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting partner reminder email job...");

    // Check for test mode
    let testEmail: string | null = null;
    try {
      const body = await req.json();
      testEmail = body.test_email || null;
    } catch {
      // No body
    }

    if (testEmail) {
      console.log(`TEST MODE: Sending only to ${testEmail}`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all partners
    const { data: partnerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "partner");

    if (!partnerRoles || partnerRoles.length === 0) {
      console.log("No partners found");
      return new Response(
        JSON.stringify({ message: "No partners found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const partnerIds = partnerRoles.map(r => r.user_id);
    console.log(`Found ${partnerIds.length} partners`);

    // Get partner profiles
    const { data: partners } = await supabase
      .from("profiles")
      .select("id, email, business_name, profile_image_url, cover_image_url, account_status")
      .in("id", partnerIds)
      .eq("account_status", "approved");

    if (!partners || partners.length === 0) {
      console.log("No approved partners found");
      return new Response(
        JSON.stringify({ message: "No approved partners found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get events count per partner
    const { data: events } = await supabase
      .from("events")
      .select("partner_id");

    const eventCountMap = new Map<string, number>();
    events?.forEach(e => {
      eventCountMap.set(e.partner_id, (eventCountMap.get(e.partner_id) || 0) + 1);
    });

    // Get gallery count per partner
    const { data: gallery } = await supabase
      .from("gallery")
      .select("partner_id");

    const galleryCountMap = new Map<string, number>();
    gallery?.forEach(g => {
      galleryCountMap.set(g.partner_id, (galleryCountMap.get(g.partner_id) || 0) + 1);
    });

    // Find partners with missing content
    const partnersNeedingReminder: Array<{
      id: string;
      email: string;
      business_name: string | null;
      hasNoEvents: boolean;
      hasNoImages: boolean;
    }> = [];

    for (const partner of partners) {
      const eventCount = eventCountMap.get(partner.id) || 0;
      const galleryCount = galleryCountMap.get(partner.id) || 0;
      const hasProfileImage = !!partner.profile_image_url;
      const hasCoverImage = !!partner.cover_image_url;

      const hasNoEvents = eventCount === 0;
      const hasNoImages = !hasProfileImage && galleryCount === 0;

      if (hasNoEvents || hasNoImages) {
        partnersNeedingReminder.push({
          id: partner.id,
          email: partner.email,
          business_name: partner.business_name,
          hasNoEvents,
          hasNoImages,
        });
      }
    }

    console.log(`Found ${partnersNeedingReminder.length} partners needing reminder`);

    if (partnersNeedingReminder.length === 0) {
      return new Response(
        JSON.stringify({ message: "All partners have complete profiles" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test mode - send only to test email
    if (testEmail) {
      const testPartner = partnersNeedingReminder[0] || { hasNoEvents: true, hasNoImages: true };
      
      try {
        const { error: emailError } = await resend.emails.send({
          from: "StudentsLife <noreply@studentslife.es>",
          to: [testEmail],
          subject: "🚀 ¡Completa tu perfil de partner en StudentsLife!",
          html: buildReminderEmail("Partner Test", testPartner.hasNoEvents, testPartner.hasNoImages),
        });

        if (emailError) {
          console.error("Error sending test email:", emailError);
          return new Response(
            JSON.stringify({ success: false, error: emailError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Test email sent to ${testEmail}`);
        return new Response(
          JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e: any) {
        console.error("Exception sending test email:", e);
        return new Response(
          JSON.stringify({ success: false, error: e.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Production mode - send to all partners needing reminder
    let sentCount = 0;
    let errorCount = 0;

    for (const partner of partnersNeedingReminder) {
      const partnerName = partner.business_name || "Partner";

      try {
        const { error: emailError } = await resend.emails.send({
          from: "StudentsLife <noreply@studentslife.es>",
          to: [partner.email],
          subject: "🚀 ¡Completa tu perfil de partner en StudentsLife!",
          html: buildReminderEmail(partnerName, partner.hasNoEvents, partner.hasNoImages),
        });

        if (emailError) {
          console.error(`Error sending to ${partner.email}:`, emailError);
          errorCount++;
        } else {
          console.log(`Email sent to ${partner.email}`);
          sentCount++;
        }
      } catch (e) {
        console.error(`Exception sending to ${partner.email}:`, e);
        errorCount++;
      }

      await delay(600);
    }

    console.log(`Partner reminder emails completed: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        partnersNeedingReminder: partnersNeedingReminder.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-partner-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildReminderEmail(partnerName: string, hasNoEvents: boolean, hasNoImages: boolean): string {
  const missingItems: string[] = [];
  
  if (hasNoEvents) {
    missingItems.push(`
      <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
        <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">📅 Crea tu primer evento/descuento</h3>
        <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">
          Los estudiantes buscan ofertas y descuentos. ¡Crea tu primera promoción para atraer más clientes!
        </p>
      </div>
    `);
  }

  if (hasNoImages) {
    missingItems.push(`
      <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #8b5cf6;">
        <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">📸 Añade fotos de tu negocio</h3>
        <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">
          Un perfil con imágenes atractivas recibe hasta 3x más visitas. ¡Sube tu logo y fotos de tu local!
        </p>
      </div>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header with Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://fkarwrqwwnssnfioiaau.supabase.co/storage/v1/object/public/avatars/logo.png" alt="StudentsLife" style="width: 120px; height: auto; margin-bottom: 15px;" />
          <h1 style="background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">StudentsLife</h1>
          <p style="color: #6b7280; margin-top: 10px;">Panel de Partners</p>
        </div>

        <!-- Main Content -->
        <div style="background: linear-gradient(135deg, #fef3c7, #fdf2f8); border-radius: 24px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">¡Hola ${partnerName}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Hemos notado que tu perfil aún no está completo. Completa estos pasos para empezar a recibir más clientes:
          </p>
        </div>

        <!-- Missing Items -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">📋 Pasos pendientes:</h3>
          ${missingItems.join('')}
        </div>

        <!-- Stats -->
        <div style="background: linear-gradient(135deg, #dbeafe, #e0e7ff); border-radius: 16px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: 600;">
            💡 Los partners con perfil completo reciben un 80% más de visitas de estudiantes
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Recibiste este email porque eres partner en StudentsLife.</p>
          <p>© 2024 StudentsLife. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}