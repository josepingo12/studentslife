import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Lock, LogOut, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(i18n.language);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = async (newLang: string) => {
    try {
      setLanguage(newLang);
      await i18n.changeLanguage(newLang);
      localStorage.setItem('appLanguage', newLang);
      toast({
        title: t('common.success'),
        description: t('success.profileUpdated'),
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: t('common.error'),
        description: 'Errore nel cambio lingua',
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('errors.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('errors.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('errors.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsChangingPassword(false);

    if (error) {
      toast({
        title: t('common.error'),
        description: t('errors.changePasswordFailed'),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('common.success'),
      description: t('success.passwordChanged'),
    });

    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('auth.logout'),
      description: t('success.loggedOut'),
    });
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: t('common.error'),
          description: t('errors.noActiveSession'),
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke('delete-own-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Delete account error:', error);
        toast({
          title: t('common.error'),
          description: t('errors.deleteAccountFailed'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('common.success'),
        description: t('success.accountDeleted'),
      });
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: t('common.error'),
        description: t('errors.deleteAccountFailed'),
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] overflow-y-auto px-4 pb-6">
        <DrawerHeader>
          <DrawerTitle>{t('settings.title')}</DrawerTitle>
        </DrawerHeader>

        <div className="mt-6 space-y-6 pb-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <Label htmlFor="language" className="text-base font-semibold">
                {t('settings.language')}
              </Label>
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password Change */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">{t('settings.changePassword')}</Label>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">
                  {t('settings.newPassword')}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t('settings.newPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm">
                  {t('settings.confirmPassword')}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('settings.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isChangingPassword ? t('settings.saving') : t('settings.changePasswordButton')}
              </Button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowLogoutDialog(true)}
              variant="destructive"
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </Button>
          </div>

          {/* Delete Account Button - Updated to match ClientSettingsSheet */}
          <div className="pt-2">
            <Button
              onClick={() => setShowDeleteAccountDialog(true)}
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar cuenta
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>

    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dialog.confirmLogoutTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialog.confirmLogoutDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>{t('auth.logout')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Account AlertDialog - Updated to match ClientSettingsSheet */}
    <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta y todos tus datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeletingAccount ? "Eliminando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default SettingsSheet;
