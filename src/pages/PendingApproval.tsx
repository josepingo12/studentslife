import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Mail, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

const PendingApproval = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is now approved every 30 seconds
    const checkApprovalStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_status")
          .eq("id", user.id)
          .single();

        if (profile?.account_status === "approved") {
          // User is now approved, redirect to login to complete the flow
          navigate("/login");
        }
      }
    };

    const interval = setInterval(checkApprovalStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md ios-card p-8 text-center space-y-6">
        {/* Logo */}
        <img src={logo} alt="Students Life" className="w-24 h-24 mx-auto mb-4" />

        {/* Status Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Clock className="w-16 h-16 text-orange-500 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1">
              <Mail className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Spanish Message */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            ¡Solicitud Recibida!
          </h1>

          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-orange-800 dark:text-orange-200 leading-relaxed">
              Tu solicitud ha sido tomada en consideración. Una vez que sea examinada por el administrador, serás dirigido a tu dashboard.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Solicitud enviada correctamente</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">¿Qué sigue?</h3>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            <li>• El administrador revisará tu solicitud</li>
            <li>• Recibirás una notificación por email</li>
            <li>• Podrás acceder a tu dashboard una vez aprobado</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Verificar Estado
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Si tienes preguntas, contacta al administrador
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;