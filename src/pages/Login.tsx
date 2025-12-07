import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const languages = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
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

        if (profile?.account_status !== "approved") {
        await supabase.auth.signOut();
        // Redirect alla pagina di attesa invece del toast
        navigate("/pending-approval");
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Gradient Background - Glovo Style */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 pb-32 pt-16" style={{ minHeight: '45vh', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}>
        {/* Floating Decorative Circles */}
        <motion.div 
          className="absolute top-20 left-10 w-24 h-24 rounded-full bg-white/10 blur-xl"
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-32 right-8 w-32 h-32 rounded-full bg-white/10 blur-xl"
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full bg-white/15 blur-lg"
          animate={{ 
            x: [0, 15, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Logo and Title */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-8">
          <motion.div
            className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <img 
              src={logo} 
              alt="Students Life" 
              className="w-24 h-24"
            />
          </motion.div>
          <motion.p
            className="text-white/90 mt-3 text-lg font-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t("auth.loginTitle")}
          </motion.p>
        </div>
      </div>

      {/* Login Card - Modern Floating Style */}
      <motion.div 
        className="relative z-20 mx-4 mt-[35vh] bg-background rounded-[28px] shadow-2xl p-6 space-y-5"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      >
        {/* Language Selector - Compact Modern */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-full border-border/50 bg-muted/50 hover:bg-muted"
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="rounded-xl">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className="gap-2 rounded-lg"
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
              {t("auth.email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="tu@email.com"
                className="pl-12 h-14 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password Field with Toggle */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
              {t("auth.password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/reset-password"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          {/* Login Button - Gradient Style */}
          <motion.div
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("auth.loggingIn")}
                </>
              ) : (
                t("auth.login")
              )}
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                {t("auth.noAccount")}
              </span>
            </div>
          </div>

          {/* Register Links - Modern Cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link to="/register-client">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/30 hover:border-primary/50 hover:bg-muted transition-all text-center">
                  <p className="text-sm font-semibold text-foreground">{t("auth.registerClient")}</p>
                </div>
              </Link>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link to="/register-partner">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/30 hover:border-primary/50 hover:bg-muted transition-all text-center">
                  <p className="text-sm font-semibold text-foreground">{t("auth.registerPartner")}</p>
                </div>
              </Link>
            </motion.div>
          </div>
        </form>
      </motion.div>

      {/* Bottom Safe Area */}
      <div className="h-8" />
    </div>
  );
};

export default Login;
