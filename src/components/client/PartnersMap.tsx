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
  // NUOVI STATI PER GEOLOCALIZZAZIONE
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // NUOVA FUNZIONE PER RICHIEDERE POSIZIONE
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalizzazione non supportata");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        console.log("Posizione utente:", { latitude, longitude });
      },
      (error) => {
        console.error("Errore geolocalizzazione:", error);
        setLocationError("Impossibile ottenere la posizione");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minuti
      }
    );
  };

  useEffect(() => {
    fetchPartners();
    requestUserLocation(); // RICHIEDI POSIZIONE ALL'AVVIO
  }, []);

  const fetchPartners = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, business_name, business_address, business_city, profile_image_url, latitude, longitude")
      .not("business_name", "is", null)
      .not("business_address", "is", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (!error && data) {
      setPartners(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!mapContainer.current || partners.length === 0) return;

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "pk.eyJ1IjoicGluZ29kZXZlbG9wbWVudCIsImEiOiJjbWk5ZW9tOXgwNHN3MmtzaDUxeDR4YjM5In0.CNdjOrEnCNdtV4PEapqiug";

    if (!MAPBOX_TOKEN) {
      console.error("MAPBOX_PUBLIC_TOKEN no está configurado");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Usa posizione utente se disponibile, altrimenti Valladolid
    const centerCoords: [number, number] = userLocation ? [userLocation.lng, userLocation.lat] : [-4.7245, 41.6523];

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: centerCoords,
      zoom: userLocation ? 14 : 12, // Zoom maggiore se abbiamo posizione utente
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

      // AGGIUNGI PUNTINO BLU PER UTENTE
      if (userLocation) {
        // Crea elemento per puntino blu
        const userMarkerEl = document.createElement("div");
        userMarkerEl.style.cssText = `
          width: 20px;
          height: 20px;
          background: #4285f4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
          cursor: pointer;
          margin-left: -10px;
          margin-top: -10px;
          position: relative;
        `;

        // Aggiungi effetto pulsante
        const pulseEl = document.createElement("div");
        pulseEl.style.cssText = `
          position: absolute;
          top: -3px;
          left: -3px;
          width: 26px;
          height: 26px;
          background: rgba(66, 133, 244, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        `;
        userMarkerEl.appendChild(pulseEl);

        // Aggiungi CSS per animazione pulse
        const style = document.createElement("style");
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            70% { transform: scale(2); opacity: 0; }
            100% { transform: scale(2); opacity: 0; }
          }
        `;
        document.head.appendChild(style);

        // Aggiungi marker utente alla mappa
        new mapboxgl.Marker(userMarkerEl, { anchor: 'center' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(
            new mapboxgl.Popup({
              offset: 15,
              closeButton: false,
              className: "user-location-popup",
            }).setHTML(`
              <div style="padding: 8px; text-align: center;">
                <h3 style="font-weight: bold; margin: 0 0 4px 0; color: #4285f4;">Estás aquí</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">Ubicación actual</p>
              </div>
            `)
          )
          .addTo(map.current!);
      }

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
          transform-origin: center center;
          margin-left: -25px;
          margin-top: -25px;
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
          el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4), 0 0 0 6px rgba(33, 150, 243, 0.3)";
          el.style.zIndex = "1000";
          el.style.filter = "brightness(1.1)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(33, 150, 243, 0.2)";
          el.style.zIndex = "1";
          el.style.filter = "brightness(1)";
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
        new mapboxgl.Marker(el, { anchor: 'center' })
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
  }, [partners, navigate, userLocation]); // AGGIUNGI userLocation alle dipendenze

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
      <div className="ios-card overflow-hidden relative" style={{ height: "400px" }}>
        <div ref={mapContainer} className="w-full h-full rounded-2xl" />

        {/* Bottone per ricentrare su utente */}
        {userLocation && (
          <button
            onClick={() => {
              map.current?.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 16,
                duration: 1000
              });
            }}
            className="absolute bottom-2 right-2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
            title="Vai alla tua posizione"
          >
            📍
          </button>
        )}
      </div>

      {locationError && (
        <p className="text-xs text-red-500 text-center mt-2">{locationError}</p>
      )}

      <p className="text-xs text-muted-foreground text-center mt-3">
        {t('partner.tapMarkerToView')}
      </p>
    </div>
  );
};

export default PartnersMap;
