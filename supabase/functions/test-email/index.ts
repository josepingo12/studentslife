import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  to_email: string;
}

// Funzione helper per inviare email con fallback
async function sendEmailWithFallback(emailData: any) {
  console.log('📧 Tentativo invio email test a:', emailData.to);
  
  try {
    // Prima prova con il dominio personalizzato
    const result = await resend.emails.send({
      ...emailData,
      from: 'StudentsLife Test <noreply@studentslife.es>',
    });
    
    console.log('✅ Email test inviata con successo dal dominio personalizzato:', result);
    return { success: true, result, from: 'studentslife.es', verified: true };
  } catch (error: any) {
    console.error('⚠️ Errore con dominio personalizzato:', error);
    
    // Se il dominio non è verificato, usa il fallback
    if (error.message?.includes('not verified') || error.message?.includes('domain') || error.statusCode === 403) {
      console.log('🔄 Dominio non verificato. Tentativo con fallback onboarding@resend.dev...');
      
      try {
        const fallbackResult = await resend.emails.send({
          ...emailData,
          from: 'StudentsLife Test <onboarding@resend.dev>',
        });
        
        console.log('✅ Email test inviata con successo via fallback:', fallbackResult);
        return { success: true, result: fallbackResult, from: 'resend.dev (fallback)', verified: false };
      } catch (fallbackError: any) {
        console.error('❌ Errore anche con fallback:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email }: TestEmailRequest = await req.json();
    
    console.log('📨 Richiesta invio email di test a:', to_email);

    const emailData = {
      to: [to_email],
      subject: '🧪 Test Email - StudentsLife',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <tr>
                <td style="background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://fkarwrqwwnssnfioiaau.supabase.co/storage/v1/object/public/avatars/logo.png" alt="StudentsLife" style="width: 80px; height: 80px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🧪 Email Test</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Test di configurazione email</p>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px 30px;">
                  <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #10B981;">
                    <h2 style="margin: 0 0 8px 0; color: #065F46; font-size: 18px; font-weight: 600;">✅ Email di test inviata con successo!</h2>
                    <p style="margin: 0; color: #047857; font-size: 14px; opacity: 0.8;">Il sistema di invio email sta funzionando correttamente</p>
                  </div>
                  
                  <div style="margin-bottom: 24px;">
                    <h3 style="color: #1E293B; font-size: 16px; margin: 0 0 12px 0;">Informazioni di test:</h3>
                    <ul style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</li>
                      <li><strong>Destinatario:</strong> ${to_email}</li>
                      <li><strong>Sistema:</strong> Resend Email Service</li>
                      <li><strong>Stato:</strong> Configurazione verificata</li>
                    </ul>
                  </div>
                  
                  <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
                      <strong>Nota:</strong> Questa è un'email di test per verificare la corretta configurazione del sistema di invio email di StudentsLife. Se hai ricevuto questa email, significa che tutto funziona correttamente! 🎉
                    </p>
                  </div>
                  
                  <div style="margin-top: 32px; text-align: center;">
                    <a href="https://studentslife.es/#/admin" style="display: inline-block; background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                      Vai alla Dashboard Admin
                    </a>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td style="background: #F8FAFC; padding: 24px 30px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0; color: #64748B; font-size: 13px;">
                    Email di test generata automaticamente da <strong style="color: #3B82F6;">StudentsLife</strong>
                  </p>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 12px;">
                    © ${new Date().getFullYear()} StudentsLife. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    const result = await sendEmailWithFallback(emailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: result.verified 
        ? '✅ Email inviata con successo! Il dominio studentslife.es è verificato.'
        : '⚠️ Email inviata via fallback. Il dominio studentslife.es non è ancora verificato su Resend. Configura i record DNS (SPF, DKIM) su GoDaddy.',
      from: result.from,
      domain_verified: result.verified,
      details: result.result,
      dns_help: !result.verified ? {
        spf: 'v=spf1 include:resend.com ~all',
        dkim: 'Aggiungi i due record CNAME forniti da Resend (resend._domainkey e resend2._domainkey)',
        verification: 'Vai su Resend Dashboard > Domains per verificare lo stato'
      } : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Errore completo in test-email function:', error);
    const err = error as any;
    
    // Log dettagliato dell'errore
    console.error('Dettagli errore:', {
      message: err?.message,
      statusCode: err?.statusCode,
      name: err?.name,
      stack: err?.stack,
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: err?.message || String(err),
      help: 'Verifica la configurazione DNS su GoDaddy e la configurazione del dominio su Resend',
      dns_records: {
        spf: { type: 'TXT', name: '@', value: 'v=spf1 include:resend.com ~all' },
        dkim1: { type: 'CNAME', name: 'resend._domainkey', value: '(fornito da Resend)' },
        dkim2: { type: 'CNAME', name: 'resend2._domainkey', value: '(fornito da Resend)' }
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
