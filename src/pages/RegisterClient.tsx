import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

const RegisterClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    university: "",
    country: "",
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("errors.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t("common.error"),
        description: t("errors.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: { session } } = await supabase.auth.getSession();

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
            university: formData.university,
            country: formData.country,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "client",
          })
          .select();

        if (roleError) throw roleError;

        try {
          await supabase.functions.invoke('notify-new-registration', {
            body: {
              userEmail: formData.email,
              userType: 'client',
              firstName: formData.firstName,
              lastName: formData.lastName,
              university: formData.university,
            }
          });
        } catch (notifyError) {
          console.error('Errore invio notifica admin:', notifyError);
        }

        await supabase.auth.signOut();

        toast({
          title: t("auth.pendingApproval"),
          description: t("auth.pendingApprovalMessage"),
          duration: 10000,
        });

        navigate("/login");
      }
    } catch (error: any) {
      toast({
        title: t("errors.signupFailed"),
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
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 pb-32 pt-12" style={{ minHeight: '35vh', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}>
        {/* Floating Decorative Circles */}
        <motion.div 
          className="absolute top-16 left-8 w-20 h-20 rounded-full bg-white/10 blur-xl"
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-24 right-6 w-28 h-28 rounded-full bg-white/10 blur-xl"
          animate={{ y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Logo and Title */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-4">
          <motion.div
            className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-cyan-300"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <img src={logo} alt="Students Life" className="w-18 h-18" />
          </motion.div>
          <motion.p 
            className="text-white/90 mt-2 text-base font-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t("auth.registerClient")}
          </motion.p>
        </div>
      </div>

      {/* Registration Card - Modern Floating Style */}
      <motion.div 
        className="relative z-20 mx-4 mt-[28vh] bg-background rounded-[28px] shadow-2xl p-5 space-y-4"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      >
        {/* Language Selector */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full border-border/50 bg-muted/50 hover:bg-muted">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="rounded-xl">
              {languages.map((language) => (
                <DropdownMenuItem key={language.code} onClick={() => changeLanguage(language.code)} className="gap-2 rounded-lg">
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">{t("auth.email")} *</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="tu@email.com"
                className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Name Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground/80">{t("auth.firstName")} *</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  required
                  className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground/80">{t("auth.lastName")} *</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  required
                  className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">{t("auth.phone")}</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* University */}
          <div className="space-y-1.5">
            <Label htmlFor="university" className="text-sm font-medium text-foreground/80">{t("auth.university")} *</Label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="university"
                required
                className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-sm font-medium text-foreground/80">{t("auth.country")} *</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="country"
                required
                className="pl-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">{t("auth.password")} *</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="pl-11 pr-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">{t("auth.confirmPassword")} *</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="pl-11 pr-11 h-12 rounded-2xl bg-muted/50 border-border/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("auth.registering")}
                </>
              ) : (
                t("auth.signup")
              )}
            </Button>
          </motion.div>

          {/* Links */}
          <div className="text-center space-y-2 pt-2">
            <Link to="/register-partner" className="text-sm text-primary hover:text-primary/80 font-medium block">
              {t("auth.isPartner")}
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground block">
              {t("auth.hasAccount")} {t("auth.login")}
            </Link>
          </div>
        </form>
      </motion.div>

      <div className="h-8" />
    </div>
  );
};

export default RegisterClient;
