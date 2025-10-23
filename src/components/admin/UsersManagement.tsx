import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, Ban, Users, Briefcase, Phone, Mail, Euro, CalendarIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  contact_email: string | null;
  phone_number: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  user_roles: { role: string }[];
}

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    contact_email: "",
    phone_number: "",
    payment_date: undefined as Date | undefined,
    payment_amount: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles with new fields
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          contact_email,
          phone_number,
          last_payment_date,
          last_payment_amount
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
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

  const startEditing = (user: Profile) => {
    setEditingUser(user.id);
    setEditForm({
      contact_email: user.contact_email || "",
      phone_number: user.phone_number || "",
      payment_date: user.last_payment_date ? new Date(user.last_payment_date) : undefined,
      payment_amount: user.last_payment_amount?.toString() || "",
    });
  };

  const saveUserData = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          contact_email: editForm.contact_email || null,
          phone_number: editForm.phone_number || null,
          last_payment_date: editForm.payment_date?.toISOString() || null,
          last_payment_amount: editForm.payment_amount ? parseFloat(editForm.payment_amount) : null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Dati utente aggiornati",
      });

      setEditingUser(null);
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
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {user.business_name || `${user.first_name} ${user.last_name}` || user.email}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>

                  {/* Informazioni di contatto e pagamento */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.contact_email || "Non inserita"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{user.phone_number || "Non inserito"}</span>
                      </div>
                    </div>

                    {user.last_payment_date && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Ultimo pagamento: {format(new Date(user.last_payment_date), "dd/MM/yyyy")}</span>
                        </div>
                        {user.last_payment_amount && (
                          <Badge className="bg-green-100 text-green-800">
                            €{user.last_payment_amount.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {getUserRole(user)}
                  {getStatusBadge(user.account_status)}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {editingUser === user.id ? (
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email Contatto</label>
                      <Input
                        placeholder="email@esempio.com"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Telefono</label>
                      <Input
                        placeholder="+39 123 456 7890"
                        value={editForm.phone_number}
                        onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Data Pagamento</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editForm.payment_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editForm.payment_date ? (
                              format(editForm.payment_date, "dd/MM/yyyy")
                            ) : (
                              "Seleziona data"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editForm.payment_date}
                            onSelect={(date) => setEditForm({...editForm, payment_date: date})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Importo (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editForm.payment_amount}
                        onChange={(e) => setEditForm({...editForm, payment_amount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveUserData(user.id)}>
                      Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                      Annulla
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEditing(user)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifica Dati
                </Button>

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
