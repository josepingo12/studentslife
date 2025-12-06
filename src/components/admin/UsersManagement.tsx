import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, Ban, Users, Briefcase, Phone, Mail, CalendarIcon, Edit, Trash2, Search, Clock, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  business_category: string | null;
  profile_image_url: string | null;
  account_status: string;
  contact_email: string | null;
  phone_number: string | null;
  business_phone: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  user_roles: { role: string }[];
  last_access?: string | null;
}

interface Category {
  name: string;
  display_name: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    contact_email: "",
    phone_number: "",
    payment_date: undefined as Date | undefined,
    payment_amount: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, [filter]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("name, display_name")
      .order("display_name");
    if (data) setCategories(data);
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const filterUsers = () => {
    let filtered = users;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.business_name?.toLowerCase().includes(query) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: accessData } = await supabase
        .from("access_logs")
        .select("user_id, accessed_at")
        .order("accessed_at", { ascending: false });

      const lastAccessMap = new Map<string, string>();
      accessData?.forEach(log => {
        if (!lastAccessMap.has(log.user_id)) {
          lastAccessMap.set(log.user_id, log.accessed_at || '');
        }
      });

      const usersWithRoles = (profilesData || []).map((profile) => ({
        ...profile,
        user_roles: rolesData?.filter((r) => r.user_id === profile.id) || [],
        last_access: lastAccessMap.get(profile.id) || null,
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
        title: "Error",
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

      if (status === "approved") {
        const user = users.find(u => u.id === userId);
        if (user && user.email) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .single();

          try {
            await supabase.functions.invoke("send-approval-email", {
              body: {
                user_email: user.email,
                user_name: user.first_name || user.business_name || "Usuario",
                user_type: roleData?.role || "client",
              },
            });
          } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
          }
        }
      }

      toast({
        title: "Éxito",
        description: `Cuenta ${status === "approved" ? "aprobada" : status === "blocked" ? "bloqueada" : "rechazada"}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción es irreversible.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sesión no válida");
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Éxito",
        description: "Usuario eliminado con éxito",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditing = (user: Profile) => {
    setEditingUser(user.id);
    setEditForm({
      contact_email: user.contact_email || user.email || "",
      phone_number: user.phone_number || user.business_phone || "",
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
        title: "Éxito",
        description: "Datos actualizados",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePartnerCategory = async (userId: string, categoryName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_category: categoryName })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Categoría actualizada",
      });

      setEditingCategory(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryDisplayName = (categoryName: string | null) => {
    if (!categoryName) return "Sin categoría";
    const cat = categories.find(c => c.name === categoryName);
    return cat?.display_name || categoryName;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-700 text-[10px] px-1.5">Aprobado</Badge>;
      case "blocked":
        return <Badge variant="destructive" className="text-[10px] px-1.5">Bloqueado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-400 text-yellow-900 font-semibold text-[10px] px-1.5 animate-pulse">Pendiente</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5">{status}</Badge>;
    }
  };

  const getUserRole = (user: Profile) => {
    const role = user.user_roles?.[0]?.role;
    return role === "partner" ? (
      <Badge variant="outline" className="text-[10px] px-1.5 gap-0.5">
        <Briefcase className="w-2.5 h-2.5" />
        Partner
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] px-1.5 gap-0.5">
        <Users className="w-2.5 h-2.5" />
        Cliente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar..."
            className="pl-9 h-10 rounded-xl bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px] h-10 rounded-xl">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="partner">Partners</SelectItem>
            <SelectItem value="client">Clientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Count */}
      <p className="text-sm text-muted-foreground">
        {filteredUsers.length} usuarios
      </p>

      {/* Compact User Cards */}
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <div 
            key={user.id}
            className="bg-card rounded-2xl border border-border/50 overflow-hidden"
          >
            {/* Main Row - Always visible */}
            <div 
              className="p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
            >
              <Avatar className="h-11 w-11 border-2 border-primary/20 flex-shrink-0">
                <AvatarImage src={user.profile_image_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                  {user.business_name?.[0] || user.first_name?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">
                    {user.business_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                  </p>
                  {getUserRole(user)}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {/* Last Access */}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {user.last_access 
                      ? formatDistanceToNow(new Date(user.last_access), { addSuffix: true, locale: es })
                      : "Sin accesos"
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(user.account_status)}
                {expandedUser === user.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedUser === user.id && (
              <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-3">
                {/* Contact Info */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {(user.contact_email || user.email) && (
                    <a 
                      href={`mailto:${user.contact_email || user.email}`}
                      className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{user.contact_email || user.email}</span>
                    </a>
                  )}
                  
                  {(user.phone_number || user.business_phone) && (
                    <>
                      <a 
                        href={`tel:${user.phone_number || user.business_phone}`}
                        className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{user.phone_number || user.business_phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/+34${(user.phone_number || user.business_phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>

                {/* Payment Info */}
                {user.last_payment_date && (
                  <div className="flex items-center gap-2 text-xs">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    <span>Último pago: {format(new Date(user.last_payment_date), "dd/MM/yyyy")}</span>
                    {user.last_payment_amount && (
                      <Badge className="bg-green-100 text-green-800 text-[10px]">
                        €{user.last_payment_amount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Edit Form */}
                {editingUser === user.id ? (
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Email</label>
                        <Input
                          placeholder="email@ejemplo.com"
                          className="h-9 text-sm rounded-lg"
                          value={editForm.contact_email}
                          onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Teléfono</label>
                        <Input
                          placeholder="+34 123 456 789"
                          className="h-9 text-sm rounded-lg"
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Fecha Pago</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-9 justify-start text-left font-normal text-sm rounded-lg",
                                !editForm.payment_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {editForm.payment_date ? format(editForm.payment_date, "dd/MM/yyyy") : "Seleccionar"}
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
                        <label className="text-xs font-medium mb-1 block">Importe (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-9 text-sm rounded-lg"
                          value={editForm.payment_amount}
                          onChange={(e) => setEditForm({...editForm, payment_amount: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-lg" onClick={() => saveUserData(user.id)}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditingUser(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Category Editor for Partners */}
                {user.user_roles?.some(r => r.role === "partner") && (
                  <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/30">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Categoría:</span>
                    {editingCategory === user.id ? (
                      <Select
                        value={user.business_category || ""}
                        onValueChange={(value) => updatePartnerCategory(user.id, value)}
                      >
                        <SelectTrigger className="h-7 w-[180px] text-xs rounded-lg">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.name} value={cat.name}>
                              {cat.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryDisplayName(user.business_category)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); setEditingCategory(user.id); }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg"
                    onClick={(e) => { e.stopPropagation(); startEditing(user); }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>

                  {user.account_status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 text-xs rounded-lg bg-green-600 hover:bg-green-700"
                        onClick={(e) => { e.stopPropagation(); updateAccountStatus(user.id, "approved"); }}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs rounded-lg"
                        onClick={(e) => { e.stopPropagation(); updateAccountStatus(user.id, "rejected"); }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {user.account_status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs rounded-lg text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={(e) => { e.stopPropagation(); updateAccountStatus(user.id, "blocked"); }}
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      Bloquear
                    </Button>
                  )}

                  {user.account_status === "blocked" && (
                    <Button
                      size="sm"
                      className="h-8 text-xs rounded-lg bg-green-600 hover:bg-green-700"
                      onClick={(e) => { e.stopPropagation(); updateAccountStatus(user.id, "approved"); }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Desbloquear
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;