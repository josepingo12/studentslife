import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const languages = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure we clear any previous session to avoid stale account mixups
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Check account status first
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_status, business_category, business_name")
          .eq("id", data.user.id)
          .maybeSingle();

        // Check if account is approved
        if (profile?.account_status !== "approved") {
          await supabase.auth.signOut();
          
          let errorTitle = t("auth.accountNotApproved");
          let errorMessage = t("auth.accountNotApprovedMessage");
          
          if (profile?.account_status === "rejected") {
            errorTitle = t("auth.accountRejected");
            errorMessage = t("auth.accountRejectedMessage");
          } else if (profile?.account_status === "blocked") {
            errorTitle = t("auth.accountBlocked");
            errorMessage = t("auth.accountBlockedMessage");
          }
          
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
            duration: 8000,
          });
          return;
        }

        // Get user role to redirect appropriately
        const { data: role, error: roleError } = await supabase
          .rpc('get_user_role', { _user_id: data.user.id });

        console.log("Role check via RPC:", { role }, "Error:", roleError);

        // Deduci/aggiorna ruolo dal profilo se necessario
        let effectiveRole = role as string | null;

        if (!roleError && !role) {
          const inferredRole = (profile?.business_category || profile?.business_name)
            ? "partner"
            : "client";
          const { error: insertRoleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: inferredRole });

          if (!insertRoleError) {
            effectiveRole = inferredRole;
            toast({
              title: "Profilo completato",
              description: `Ruolo '${inferredRole === "partner" ? "partner" : "cliente"}' assegnato automaticamente.`,
            });
          }
        }
        // Upgrade automatico: se ha dati business ma ruolo client, promuovi a partner
        if (effectiveRole === "client" && (profile?.business_category || profile?.business_name)) {
          const { error: ensurePartnerError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: "partner" });
          if (!ensurePartnerError) {
            effectiveRole = "partner";
          }
        }

        toast({
          title: t("auth.loginSuccess"),
          description: t("auth.welcome"),
        });

        // Redirect based on role
        if (effectiveRole === "admin") {
          navigate("/admin");
        } else if (effectiveRole === "partner") {
          navigate("/partner-dashboard");
        } else if (effectiveRole === "client") {
          navigate("/client-dashboard");
        } else {
          // Nessun ruolo determinato: guida alla registrazione
          toast({
            title: t("auth.registrationComplete"),
            description: t("auth.verifyEmail"),
          });
          navigate("/register-client");
        }
      }
    } catch (error: any) {
      toast({
        title: t("errors.loginFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md ios-card p-6 space-y-6">
        <div className="text-center">
          <img src={logo} alt="Students Life" className="w-32 h-32 mx-auto mb-2" />
          <p className="text-muted-foreground mt-2">{t("auth.loginTitle")}</p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className="gap-2"
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              className="ios-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              required
              className="ios-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-sm text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full ios-button h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.loggingIn")}
              </>
            ) : (
              t("auth.login")
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t("auth.noAccount")}</p>
            <div className="flex gap-2 justify-center">
              <Link
                to="/register-client"
                className="text-sm text-primary hover:underline"
              >
                {t("auth.registerClient")}
              </Link>
              <span className="text-muted-foreground">{t("auth.orText")}</span>
              <Link
                to="/register-partner"
                className="text-sm text-primary hover:underline"
              >
                {t("auth.registerPartner")}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
