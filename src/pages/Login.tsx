import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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
        // Get user role to redirect appropriately
        const { data: role, error: roleError } = await supabase
          .rpc('get_user_role', { _user_id: data.user.id });

        console.log("Role check via RPC:", { role }, "Error:", roleError);

        // Deduci/aggiorna ruolo dal profilo se necessario
        let effectiveRole = role as string | null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_category, business_name")
          .eq("id", data.user.id)
          .maybeSingle();

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
          title: "Accesso effettuato!",
          description: "Benvenuto su Students Life",
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
            title: "Completa la registrazione",
            description: "Seleziona il tuo ruolo per continuare.",
          });
          navigate("/register-client");
        }
      }
    } catch (error: any) {
      toast({
        title: "Errore durante l'accesso",
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
          <p className="text-muted-foreground mt-2">Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
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
              Password dimenticata?
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
                Accesso...
              </>
            ) : (
              "Accedi"
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Non hai un account?</p>
            <div className="flex gap-2 justify-center">
              <Link
                to="/register-client"
                className="text-sm text-primary hover:underline"
              >
                Registrati come Cliente
              </Link>
              <span className="text-muted-foreground">o</span>
              <Link
                to="/register-partner"
                className="text-sm text-primary hover:underline"
              >
                Partner
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
