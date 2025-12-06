import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting marketing email job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users who haven't accessed in 6+ days
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    console.log("Looking for inactive users since:", sixDaysAgo.toISOString());

    // Get all users with their last access
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, business_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} total profiles`);

    // Get active events with partner info
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        id, title, description, image_url, discount_percentage,
        partner_id
      `)
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .limit(6);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} active events`);

    if (!events || events.length === 0) {
      console.log("No active events to promote");
      return new Response(
        JSON.stringify({ message: "No active events to promote" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get partner info for events
    const partnerIds = [...new Set(events.map(e => e.partner_id))];
    const { data: partners } = await supabase
      .from("profiles")
      .select("id, business_name, profile_image_url")
      .in("id", partnerIds);

    const partnerMap = new Map(partners?.map(p => [p.id, p]) || []);

    // Find inactive users
    const inactiveUsers: any[] = [];
    
    for (const profile of profiles || []) {
      const { data: lastAccess } = await supabase
        .from("access_logs")
        .select("accessed_at")
        .eq("user_id", profile.id)
        .order("accessed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastAccessDate = lastAccess?.accessed_at 
        ? new Date(lastAccess.accessed_at) 
        : new Date(0);

      if (lastAccessDate < sixDaysAgo) {
        inactiveUsers.push(profile);
      }
    }

    console.log(`Found ${inactiveUsers.length} inactive users`);

    if (inactiveUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inactive users to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build event cards HTML
    const eventCardsHtml = events.map(event => {
      const partner = partnerMap.get(event.partner_id);
      const imageUrl = event.image_url || partner?.profile_image_url || '';
      const discountBadge = event.discount_percentage && event.discount_percentage > 0
        ? `<span style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${event.discount_percentage}% OFF</span>`
        : '';

      return `
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 20px;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${event.title}" style="width: 100%; height: 180px; object-fit: cover;" />` : ''}
          <div style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              ${partner?.profile_image_url ? `<img src="${partner.profile_image_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />` : ''}
              <span style="font-weight: 600; color: #374151;">${partner?.business_name || 'Partner'}</span>
              ${discountBadge}
            </div>
            <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">${event.title}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${event.description || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    // Send emails to inactive users
    let sentCount = 0;
    let errorCount = 0;

    for (const user of inactiveUsers) {
      const userName = user.first_name || user.business_name || 'Usuario';
      
      try {
        const { error: emailError } = await resend.emails.send({
          from: "StudentsLife <noreply@studentslife.es>",
          to: [user.email],
          subject: "🎉 ¡Te echamos de menos! Mira las nuevas ofertas",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">StudentsLife</h1>
                  <p style="color: #6b7280; margin-top: 10px;">Tu app de descuentos universitarios</p>
                </div>

                <!-- Main Content -->
                <div style="background: linear-gradient(135deg, #fdf2f8, #faf5ff); border-radius: 24px; padding: 30px; margin-bottom: 30px;">
                  <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">¡Hola ${userName}! 👋</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                    Hace tiempo que no te vemos por aquí. ¡Tenemos nuevas ofertas increíbles esperándote! 
                    Mira lo que nuestros socios tienen preparado para ti:
                  </p>
                </div>

                <!-- Events -->
                <div style="margin-bottom: 30px;">
                  <h3 style="color: #111827; font-size: 20px; margin-bottom: 20px;">🔥 Ofertas destacadas</h3>
                  ${eventCardsHtml}
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="https://studentslife.es" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                    ¡Ver todas las ofertas!
                  </a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>Recibiste este email porque tienes una cuenta en StudentsLife.</p>
                  <p>© 2024 StudentsLife. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error(`Error sending to ${user.email}:`, emailError);
          errorCount++;
        } else {
          console.log(`Email sent to ${user.email}`);
          sentCount++;
        }
      } catch (e) {
        console.error(`Exception sending to ${user.email}:`, e);
        errorCount++;
      }
    }

    console.log(`Marketing emails completed: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errorCount,
        inactiveUsers: inactiveUsers.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-marketing-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
