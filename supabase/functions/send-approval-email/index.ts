import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalEmailRequest {
  user_email: string;
  user_name: string;
  user_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_email, user_name, user_type }: ApprovalEmailRequest = await req.json();

    const { error } = await resend.emails.send({
      from: 'StudentsLife <onboarding@resend.dev>',
      to: [user_email],
      subject: '✅ ¡Tu cuenta ha sido aprobada!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%); padding: 50px 30px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+'); opacity: 0.3;"></div>
                  <img src="https://fkarwrqwwnssnfioiaau.supabase.co/storage/v1/object/public/avatars/logo.png" alt="StudentsLife" style="width: 100px; height: 100px; border-radius: 24px; margin-bottom: 24px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); position: relative; z-index: 1; background: white; padding: 8px;">
                  <div style="position: relative; z-index: 1;">
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 50px; padding: 12px 28px; display: inline-block; margin-bottom: 16px;">
                      <span style="font-size: 32px;">🎉</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 8px rgba(0,0,0,0.1);">¡Bienvenido a StudentsLife!</h1>
                    <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 18px; font-weight: 500;">Tu cuenta ha sido revisada y aprobada</p>
                  </div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 50px 30px;">
                  <div style="text-align: center; margin-bottom: 40px;">
                    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h2 style="margin: 0 0 12px 0; color: #1E293B; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">¡Cuenta Aprobada!</h2>
                    <p style="margin: 0; color: #64748B; font-size: 16px; line-height: 1.6;">Hola <strong style="color: #1E293B;">${user_name}</strong>,</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #DBEAFE 0%, #E0F2FE 100%); border-radius: 16px; padding: 28px; margin-bottom: 32px; border: 2px solid #3B82F6;">
                    <p style="margin: 0 0 16px 0; color: #1E3A8A; font-size: 16px; line-height: 1.7;">
                      Nos complace informarte que tu solicitud de registro como <strong>${user_type === 'partner' ? 'Socio' : 'Estudiante'}</strong> ha sido <strong>revisada y aprobada exitosamente</strong>. 🎊
                    </p>
                    <p style="margin: 0; color: #1E40AF; font-size: 15px; line-height: 1.7;">
                      Ya puedes acceder a todas las funcionalidades de la plataforma y comenzar a disfrutar de la experiencia StudentsLife.
                    </p>
                  </div>
                  
                  <div style="background: #F8FAFC; border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #4F9CF9;">
                    <h3 style="margin: 0 0 16px 0; color: #1E293B; font-size: 18px; font-weight: 600;">📱 Próximos pasos:</h3>
                    <ul style="margin: 0; padding-left: 24px; color: #475569; font-size: 15px; line-height: 2;">
                      <li>Inicia sesión con tus credenciales</li>
                      <li>Completa tu perfil al 100%</li>
                      <li>Explora todas las funcionalidades disponibles</li>
                      <li>Conéctate con la comunidad StudentsLife</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="https://studentslife.lovable.app/login" style="display: inline-block; background: linear-gradient(135deg, #4F9CF9 0%, #3B82F6 100%); color: white; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 17px; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); transition: transform 0.2s; letter-spacing: 0.3px;">
                      Iniciar Sesión Ahora
                    </a>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; border: 1px solid #F59E0B;">
                    <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6; text-align: center;">
                      <strong>💡 Consejo:</strong> Mantén tu perfil actualizado para aprovechar al máximo todas las oportunidades que te ofrece StudentsLife
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); padding: 32px 30px; text-align: center; border-top: 1px solid #CBD5E1;">
                  <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                    ¿Tienes preguntas? Contáctanos en cualquier momento.<br>
                    Estamos aquí para ayudarte. 💙
                  </p>
                  <div style="margin: 20px 0;">
                    <a href="mailto:stud3nts1ife.info@gmail.com" style="display: inline-block; background: white; color: #3B82F6; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 0 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                      📧 Contactar Soporte
                    </a>
                  </div>
                  <p style="margin: 24px 0 0 0; color: #64748B; font-size: 13px; font-weight: 500;">
                    <strong style="color: #3B82F6; font-size: 16px;">StudentsLife</strong>
                  </p>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 12px;">
                    © ${new Date().getFullYear()} StudentsLife. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Decorative Elements -->
            <div style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">
                Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-approval-email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
