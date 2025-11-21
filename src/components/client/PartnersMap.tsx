import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Partner {
  id: string;
  business_name: string;
  business_address: string;
  business_city: string;
  profile_image_url: string;
  latitude?: number;
  longitude?: number;
}

const PartnersMap = () => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, business_name, business_address, business_city, profile_image_url")
      .not("business_name", "is", null)
      .not("business_address", "is", null);

    if (!error && data) {
      // For demo purposes, assign random coordinates around Valladolid, Spain
      const partnersWithCoords = data.map((partner, idx) => ({
        ...partner,
        latitude: 41.6523 + (Math.random() - 0.5) * 0.1,
        longitude: -4.7245 + (Math.random() - 0.5) * 0.1,
      }));
      setPartners(partnersWithCoords);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!mapContainer.current || partners.length === 0) return;

    // Get the MAPBOX token from environment
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!MAPBOX_TOKEN) {
      console.error("MAPBOX_PUBLIC_TOKEN no está configurado");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-4.7245, 41.6523], // Valladolid, Spain
      zoom: 12,
      pitch: 45,
    });

    map.current.on("load", () => {
      // Add 3D buildings
      const layers = map.current!.getStyle().layers;
      let labelLayerId: string | undefined;
      for (let i = 0; i < layers!.length; i++) {
        if (layers![i].type === "symbol" && layers![i].layout!["text-field"]) {
          labelLayerId = layers![i].id;
          break;
        }
      }

      map.current!.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId
      );

      // Add markers for each partner
      partners.forEach((partner) => {
        if (!partner.latitude || !partner.longitude) return;

        // Create custom marker element
        const el = document.createElement("div");
        el.className = "partner-marker";
        el.style.cssText = `
          width: 50px;
          height: 50px;
          cursor: pointer;
          background: white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(33, 150, 243, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 3px solid #2196F3;
        `;

        // Add logo image
        const img = document.createElement("img");
        img.src = partner.profile_image_url || "/placeholder.svg";
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
        `;
        el.appendChild(img);

        // Add hover effect
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.2) translateY(-8px)";
          el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4), 0 0 0 6px rgba(33, 150, 243, 0.3)";
          el.style.zIndex = "1000";
        });

        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1) translateY(0)";
          el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(33, 150, 243, 0.2)";
          el.style.zIndex = "1";
        });

        // Add click handler
        el.addEventListener("click", () => {
          navigate(`/partner/${partner.id}`);
        });

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: "partner-popup",
        }).setHTML(`
          <div style="padding: 8px; text-align: center;">
            <h3 style="font-weight: bold; margin: 0 0 4px 0; color: #2196F3;">${partner.business_name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${partner.business_city}</p>
          </div>
        `);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([partner.longitude, partner.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [partners, navigate]);

  if (loading) {
    return (
      <div className="ios-card p-8 mx-4">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-muted-foreground">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <div className="ios-card overflow-hidden" style={{ height: "400px" }}>
        <div ref={mapContainer} className="w-full h-full rounded-2xl" />
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        {t('partner.tapMarkerToView')}
      </p>
    </div>
  );
};

export default PartnersMap;