import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/shared/ImageUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PartnerGalleryManager from "@/components/partner/PartnerGalleryManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface PartnerProfileEditProps {
  profile: any;
  onUpdate: () => void;
}

const PartnerProfileEdit = ({ profile, onUpdate }: PartnerProfileEditProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    business_name: profile.business_name || "",
    business_description: profile.business_description || "",
    business_address: profile.business_address || "",
    business_city: profile.business_city || "",
    business_phone: profile.business_phone || "",
    business_category: profile.business_category || "",
    profile_image_url: profile.profile_image_url || "",
    cover_image_url: profile.cover_image_url || "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_name");
    
    if (data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", profile.id);

    if (error) {
      toast({
        title: t("profileEdit.error"),
        description: t("profileEdit.errorUpdating"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("profileEdit.success"),
        description: t("profileEdit.successDescription"),
      });
      onUpdate();
    }

    setLoading(false);
  };

  return (
    <div className="ios-card p-6">
      <h2 className="text-xl font-bold mb-6">{t("profileEdit.title")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t("profileEdit.businessName")}</Label>
          <Input
            className="ios-input"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.description")}</Label>
          <Textarea
            className="ios-input"
            value={formData.business_description}
            onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.address")}</Label>
          <Input
            className="ios-input"
            value={formData.business_address}
            onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.city")}</Label>
          <Input
            className="ios-input"
            value={formData.business_city}
            onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.category")}</Label>
          <Select
            value={formData.business_category}
            onValueChange={(value) => setFormData({ ...formData, business_category: value })}
          >
            <SelectTrigger className="ios-input">
              <SelectValue placeholder={t("profileEdit.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.phone")}</Label>
          <Input
            type="tel"
            className="ios-input"
            value={formData.business_phone}
            onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.profilePhoto")}</Label>
          {formData.profile_image_url && (
            <div className="flex justify-center mb-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profile_image_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {formData.business_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <ImageUploader
            bucket="avatars"
            userId={profile.id}
            onUploadComplete={(url) => setFormData({ ...formData, profile_image_url: url })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.coverPhoto")}</Label>
          <p className="text-sm text-muted-foreground mb-2">
            {t("profileEdit.coverDescription")}
          </p>
          {formData.cover_image_url && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img 
                src={formData.cover_image_url} 
                alt="Copertina" 
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          <ImageUploader
            bucket="avatars"
            userId={profile.id}
            onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full ios-button h-12"
        >
          {loading ? t("profileEdit.saving") : t("profileEdit.saveChanges")}
        </Button>
      </form>

      {/* Gallery Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">{t("profileEdit.galleryPhotos")}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("profileEdit.galleryDescription")}
        </p>
        <PartnerGalleryManager partnerId={profile.id} />
      </div>
    </div>
  );
};

export default PartnerProfileEdit;
