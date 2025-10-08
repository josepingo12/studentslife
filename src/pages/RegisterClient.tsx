import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

const RegisterClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
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
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        console.log("User signed up:", authData.user.id);
        
        // Wait for session to be established
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session after signup:", session);

        // Update profile with client data
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

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }

        console.log("Profile updated successfully");

        // Assign client role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "client",
          })
          .select();

        console.log("Role insert result:", { roleData, roleError });

        if (roleError) {
          console.error("Role insert error:", roleError);
          throw roleError;
        }

        // Sign out immediately after registration
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md ios-card p-6 space-y-6">
        <div className="text-center">
          <img src={logo} alt="Students Life" className="w-32 h-32 mx-auto mb-2" />
          <p className="text-muted-foreground mt-2">{t("auth.registerClient")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")} *</Label>
            <Input
              id="email"
              type="email"
              required
              className="ios-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("auth.firstName")} *</Label>
              <Input
                id="firstName"
                required
                className="ios-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t("auth.lastName")} *</Label>
              <Input
                id="lastName"
                required
                className="ios-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              className="ios-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">{t("auth.university")} *</Label>
            <Input
              id="university"
              required
              className="ios-input"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t("auth.country")} *</Label>
            <Input
              id="country"
              required
              className="ios-input"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")} *</Label>
            <Input
              id="password"
              type="password"
              required
              className="ios-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmPassword")} *</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              className="ios-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            className="w-full ios-button h-12"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.registering")}
              </>
            ) : (
              t("auth.signup")
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link
              to="/register-partner"
              className="text-sm text-primary hover:underline block"
            >
              {t("auth.isPartner")}
            </Link>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground block"
            >
              {t("auth.hasAccount")} {t("auth.login")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterClient;
