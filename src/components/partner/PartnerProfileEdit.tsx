import { useState, useEffect, useCallback } from "react";
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
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

interface PartnerProfileEditProps {
  profile: any;
  onUpdate: () => void;
}

const PartnerProfileEdit = ({ profile, onUpdate }: PartnerProfileEditProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeSuccess, setGeocodeSuccess] = useState(false);
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
    latitude: profile.latitude || "",
    longitude: profile.longitude || "",
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

  // Geocode address automatically
  const geocodeAddress = useCallback(async (address: string, city: string) => {
    if (!address || !city || !MAPBOX_TOKEN) return;
    
    const fullAddress = `${address}, ${city}, España`;
    setGeocoding(true);
    setGeocodeSuccess(false);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=ES`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
        setGeocodeSuccess(true);
        
        toast({
          title: "📍 Coordenadas generadas",
          description: "Las coordenadas se han obtenido automáticamente de la dirección.",
        });
      }
    } catch (error) {
      console.error("Error geocoding:", error);
    } finally {
      setGeocoding(false);
    }
  }, [toast]);

  // Debounced geocoding when address or city changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.business_address && formData.business_city) {
        geocodeAddress(formData.business_address, formData.business_city);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.business_address, formData.business_city, geocodeAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate coordinates
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude as string);
      const lng = parseFloat(formData.longitude as string);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast({
          title: t("profileEdit.error"),
          description: t("profileEdit.invalidLatitude"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast({
          title: t("profileEdit.error"),
          description: t("profileEdit.invalidLongitude"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const updateData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude as string) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude as string) : null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
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
          <div className="relative">
            <Input
              className="ios-input pr-10"
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              placeholder="Calle Gran Vía, 1"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {geocoding ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : geocodeSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("profileEdit.city")}</Label>
          <Input
            className="ios-input"
            value={formData.business_city}
            onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
            placeholder="Valladolid"
          />
          {geocoding && (
            <p className="text-xs text-primary flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generando coordenadas automáticamente...
            </p>
          )}
        </div>

        {/* Coordinates Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">{t("profileEdit.coordinates")}</h3>
              <p className="text-sm text-muted-foreground">
                Se generan automáticamente desde la dirección
              </p>
            </div>
            {geocodeSuccess && (
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Auto-generadas
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("profileEdit.latitude")}</Label>
              <Input
                type="number"
                step="any"
                placeholder="41.6523"
                className="ios-input"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t("profileEdit.latitudeHelper")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("profileEdit.longitude")}</Label>
              <Input
                type="number"
                step="any"
                placeholder="-4.7245"
                className="ios-input"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t("profileEdit.longitudeHelper")}
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              💡 {t("profileEdit.coordinatesHelper")}
            </p>
          </div>
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
