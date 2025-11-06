import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationNotificationRequest {
  userEmail: string;
  userType: 'partner' | 'client';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  university?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userType, firstName, lastName, businessName, university }: RegistrationNotificationRequest = await req.json();
    
    console.log('📧 Invio notifica nuova registrazione:', { userType, userEmail });

    // Determina il tipo di utente in italiano
    const userTypeIT = userType === 'partner' ? 'Partner' : 'Studente';
    
    // Crea il corpo dell'email con le info dell'utente
    let userInfo = `<p><strong>Email:</strong> ${userEmail}</p>`;
    
    if (userType === 'partner' && businessName) {
      userInfo += `<p><strong>Nome Attività:</strong> ${businessName}</p>`;
    } else if (userType === 'client') {
      if (firstName || lastName) {
        userInfo += `<p><strong>Nome:</strong> ${firstName || ''} ${lastName || ''}</p>`;
      }
      if (university) {
        userInfo += `<p><strong>Università:</strong> ${university}</p>`;
      }
    }

    const emailData = {
      to: ['stud3nts1ife.info@gmail.com'],
      subject: `Nuova Registrazione ${userTypeIT} - StudentsLife`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Nuova Registrazione</h1>
              </div>
              <div class="content">
                <h2>Un nuovo ${userTypeIT} si è registrato!</h2>
                <p>È necessaria la tua approvazione per attivare l'account.</p>
                
                <div class="info-box">
                  <h3>Dettagli Utente:</h3>
                  ${userInfo}
                </div>

                <p>Accedi alla dashboard amministrativa per approvare o rifiutare la registrazione.</p>
                
                <a href="https://studentslife.es/admin-dashboard" class="button">
                  Vai alla Dashboard Admin
                </a>

                <div class="footer">
                  <p>StudentsLife - Sistema di Gestione Partner e Studenti</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Prova prima con il dominio personalizzato
    try {
      const result = await resend.emails.send({
        ...emailData,
        from: 'StudentsLife <noreply@studentslife.es>',
      });
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('✅ Email notifica inviata con successo dal dominio personalizzato:', result);
      return new Response(
        JSON.stringify({ success: true, result, from: 'studentslife.es' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error: any) {
      console.log('⚠️ Errore con dominio personalizzato, provo fallback:', error.message);
      
      // Fallback a resend.dev
      try {
        const fallbackResult = await resend.emails.send({
          ...emailData,
          from: 'StudentsLife <onboarding@resend.dev>',
        });
        
        if (fallbackResult.error) {
          throw fallbackResult.error;
        }
        
        console.log('✅ Email notifica inviata con successo via fallback:', fallbackResult);
        return new Response(
          JSON.stringify({ success: true, result: fallbackResult, from: 'resend.dev (fallback)' }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (fallbackError: any) {
        console.error('❌ Errore anche con fallback:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error: any) {
    console.error("❌ Errore in notify-new-registration:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
