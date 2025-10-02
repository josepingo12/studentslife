import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const RegisterPartner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessCategory: "",
  });

  const categories = [
    { value: "bar_restaurant", label: "Bar e Ristoranti" },
    { value: "fitness", label: "Fitness" },
    { value: "entertainment", label: "Intrattenimento" },
    { value: "health_beauty", label: "Salute e Bellezza" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
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

        if (profileError) throw profileError;

        // Assign partner role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "partner",
          });

        if (roleError) throw roleError;

        toast({
          title: "Registrazione completata!",
          description: "Verifica la tua email per confermare l'account",
        });

        navigate("/login");
      }
    } catch (error: any) {
      toast({
        title: "Errore durante la registrazione",
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
          <h1 className="text-3xl font-bold text-primary">Students Life</h1>
          <p className="text-muted-foreground mt-2">Registrati come Partner</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
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
            <Label htmlFor="businessName">Nome Attività *</Label>
            <Input
              id="businessName"
              required
              className="ios-input"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Via Attività *</Label>
            <Input
              id="businessAddress"
              required
              className="ios-input"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessCity">Località *</Label>
            <Input
              id="businessCity"
              required
              className="ios-input"
              value={formData.businessCity}
              onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessCategory">Categoria *</Label>
            <Select
              value={formData.businessCategory}
              onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
              required
            >
              <SelectTrigger className="ios-input">
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
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
            <Label htmlFor="confirmPassword">Conferma Password *</Label>
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
                Registrazione...
              </>
            ) : (
              "Registrati"
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link
              to="/register-client"
              className="text-sm text-primary hover:underline block"
            >
              Sei un cliente? Registrati qui
            </Link>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground block"
            >
              Hai già un account? Accedi
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPartner;
