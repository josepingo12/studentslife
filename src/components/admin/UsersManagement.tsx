import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Ban, Users, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  account_status: string;
  user_roles: { role: string }[];
}

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Then get roles for each user
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge data
      const usersWithRoles = (profilesData || []).map((profile) => ({
        ...profile,
        user_roles: rolesData?.filter((r) => r.user_id === profile.id) || [],
      }));

      let filtered = usersWithRoles;

      if (filter === "partner") {
        filtered = usersWithRoles.filter((u) =>
          u.user_roles.some((r) => r.role === "partner")
        );
      } else if (filter === "client") {
        filtered = usersWithRoles.filter((u) =>
          u.user_roles.some((r) => r.role === "client")
        );
      }

      setUsers(filtered);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAccountStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: status })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Account ${status === "approved" ? "approvato" : status === "blocked" ? "bloccato" : "rifiutato"}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approvato</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloccato</Badge>;
      case "pending":
        return <Badge variant="secondary">In Attesa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserRole = (user: Profile) => {
    const role = user.user_roles?.[0]?.role;
    return role === "partner" ? (
      <Badge variant="outline">
        <Briefcase className="w-3 h-3 mr-1" />
        Partner
      </Badge>
    ) : (
      <Badge variant="outline">
        <Users className="w-3 h-3 mr-1" />
        Cliente
      </Badge>
    );
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Utenti</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtra per tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli utenti</SelectItem>
            <SelectItem value="partner">Solo Partner</SelectItem>
            <SelectItem value="client">Solo Clienti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {user.business_name || `${user.first_name} ${user.last_name}` || user.email}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {getUserRole(user)}
                  {getStatusBadge(user.account_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {user.account_status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateAccountStatus(user.id, "approved")}
                      className="ios-button"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approva
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAccountStatus(user.id, "blocked")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rifiuta
                    </Button>
                  </>
                )}
                {user.account_status === "approved" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateAccountStatus(user.id, "blocked")}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Blocca Account
                  </Button>
                )}
                {user.account_status === "blocked" && (
                  <Button
                    size="sm"
                    onClick={() => updateAccountStatus(user.id, "approved")}
                    className="ios-button"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Sblocca
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;
