import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { toast } from "sonner";

interface BlockUserButtonProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
  onBlocked?: () => void;
}

const BlockUserButton = ({
  userId,
  userName,
  trigger,
  onBlocked,
}: BlockUserButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("user_blocks").insert({
        blocker_user_id: user.id,
        blocked_user_id: userId,
      });

      if (error) throw error;

      toast.success(`Has bloqueado a ${userName}`);
      onBlocked?.();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      if (error.code === "23505") {
        toast.error("Ya has bloqueado a este usuario");
      } else {
        toast.error("Error al bloquear usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Ban className="w-4 h-4 mr-2" />
            Bloquear
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Bloquear a {userName}?</AlertDialogTitle>
          <AlertDialogDescription>
            No podrás ver el contenido de este usuario y no podrá interactuar contigo.
            Podrás desbloquearlo más tarde desde tu perfil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} disabled={loading}>
            {loading ? "Bloqueando..." : "Bloquear usuario"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BlockUserButton;
