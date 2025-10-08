import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

interface Category {
  id: string;
  name: string;
  display_name: string;
}

const RegisterPartner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessCategory: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
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
      // Clear any existing session first to avoid refresh token errors
      await supabase.auth.signOut();

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes("already registered") || authError.status === 422) {
          throw new Error("Questa email è già registrata. Vai al login o usa un'altra email.");
        }
        throw authError;
      }

      if (authData.user) {
        console.log("User signed up:", authData.user.id);
        
        // Wait for session to be established
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session after signup:", session);

        // Update profile with partner data
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            business_name: formData.businessName,
            business_address: formData.businessAddress,
            business_city: formData.businessCity,
            business_category: formData.businessCategory,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }

        console.log("Profile updated successfully");

        // Assign partner role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "partner",
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
          <p className="text-muted-foreground mt-2">{t("auth.registerPartner")}</p>
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

          <div className="space-y-2">
            <Label htmlFor="businessName">{t("auth.businessName")} *</Label>
            <Input
              id="businessName"
              required
              className="ios-input"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">{t("auth.businessAddress")} *</Label>
            <Input
              id="businessAddress"
              required
              className="ios-input"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessCity">{t("auth.businessCity")} *</Label>
            <Input
              id="businessCity"
              required
              className="ios-input"
              value={formData.businessCity}
              onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessCategory">{t("partner.category")} *</Label>
            <Select
              value={formData.businessCategory}
              onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
              required
            >
              <SelectTrigger className="ios-input">
                <SelectValue placeholder={t("auth.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              to="/register-client"
              className="text-sm text-primary hover:underline block"
            >
              {t("auth.isClient")}
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

export default RegisterPartner;
