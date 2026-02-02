import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIssues, IssueCategory, IssueStatus } from "@/contexts/IssueContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Filter } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import IssueFilterControl from "./IssueFilterControl";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAP_ID } from "@/config/constants";
import { logger } from "@/lib/logger";
import { googleMapsLoader } from "@/lib/googleMapsLoader";
import { useAuth } from "@/contexts/AuthContext";

const LEIRIA_COORDINATES = { lat: 39.744, lng: -8.807 };

interface IssueMapProps {
  onIssueSelect?: (issueId: string) => void;
  height?: string;
  enableFilters?: boolean;
}

type AnyMarker = any;

const IssueMap: React.FC<IssueMapProps> = ({
  onIssueSelect,
  height = "h-[calc(100vh-64px)]",
  enableFilters = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // ✅ mantém callback estável (não rebenta markers quando a page re-renderiza)
  const onIssueSelectRef = useRef<IssueMapProps["onIssueSelect"]>(onIssueSelect);
  useEffect(() => {
    onIssueSelectRef.current = onIssueSelect;
  }, [onIssueSelect]);

  // markers para cleanup
  const markersRef = useRef<AnyMarker[]>([]);

  const { issues } = useIssues();
  const { user } = useAuth();

  const [selectedFilters, setSelectedFilters] = useState<{
    category?: IssueCategory;
    status?: IssueStatus;
  }>({});

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (
        selectedFilters.category &&
        issue.category !== selectedFilters.category
      )
        return false;
      if (selectedFilters.status && issue.status !== selectedFilters.status)
        return false;
      return true;
    });
  }, [issues, selectedFilters]);

  // Init map
  useEffect(() => {
    const initializeMap = async () => {
      if (!GOOGLE_MAPS_API_KEY) return;
      if (!mapContainer.current) return;
      if (mapRef.current) return;

      try {
        const { Map } = (await googleMapsLoader.importLibrary("maps")) as any;

        mapRef.current = new Map(mapContainer.current, {
          center: LEIRIA_COORDINATES,
          zoom: 12,
          mapId: GOOGLE_MAP_ID,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        setMapLoaded(true);
        setMapError(null);
      } catch (error) {
        logger.error("Error initializing Google Maps:", error);
        setMapError(
          "Falha ao inicializar o mapa. Confirma a API key, Map ID e permissões."
        );
      }
    };

    initializeMap();

    return () => {
      // cleanup markers
      markersRef.current.forEach((m) => {
        try {
          if ("map" in m) m.map = null; // AdvancedMarkerElement
          if (typeof m.setMap === "function") m.setMap(null); // Classic Marker
        } catch {}
      });
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    const renderMarkers = async () => {
      if (!mapRef.current || !mapLoaded || !GOOGLE_MAPS_API_KEY) return;

      // limpa markers anteriores
      markersRef.current.forEach((m) => {
        try {
          if ("map" in m) m.map = null;
          if (typeof m.setMap === "function") m.setMap(null);
        } catch {}
      });
      markersRef.current = [];

      let AdvancedMarkerElement: any = null;

      try {
        const markerLib = (await googleMapsLoader.importLibrary(
          "marker"
        )) as any;
        AdvancedMarkerElement = markerLib?.AdvancedMarkerElement ?? null;
      } catch {
        AdvancedMarkerElement = null;
      }

      const g = (window as any).google;

      filteredIssues.forEach((issue) => {
        const lat = Number(issue.location.latitude);
        const lng = Number(issue.location.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const handleSelect = () => {
          // ✅ usa ref estável (não depende de re-renders)
          onIssueSelectRef.current?.(issue.id);
        };

        // 1) AdvancedMarker
        if (AdvancedMarkerElement) {
          const markerEl = document.createElement("div");
          markerEl.className = "relative cursor-pointer";
          markerEl.style.width = "24px";
          markerEl.style.height = "24px";

          const pin = document.createElement("div");
          pin.className =
            "w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white";

          switch (issue.status) {
            case "open":
              pin.style.backgroundColor = "#ef4444";
              break;
            case "in_progress":
              pin.style.backgroundColor = "#f59e0b";
              break;
            case "resolved":
              pin.style.backgroundColor = "#16a34a";
              break;
            default:
              pin.style.backgroundColor = "#3b82f6";
          }

          const dot = document.createElement("div");
          dot.className = "w-2 h-2 bg-white rounded-full";
          pin.appendChild(dot);
          markerEl.appendChild(pin);

          const advMarker = new AdvancedMarkerElement({
            map: mapRef.current,
            position: { lat, lng },
            content: markerEl,
            title: issue.title,
          });

          // ✅ evento correto para AdvancedMarker
          advMarker.addListener?.("gmp-click", handleSelect);

          // fallback de clique no HTML
          markerEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSelect();
          });

          markersRef.current.push(advMarker);
          return;
        }

        // 2) Classic Marker fallback
        if (g?.maps?.Marker) {
          const classicMarker = new g.maps.Marker({
            map: mapRef.current,
            position: { lat, lng },
            title: issue.title,
          });

          classicMarker.addListener("click", handleSelect);
          markersRef.current.push(classicMarker);
          return;
        }

        logger.error(
          "No marker implementation available (AdvancedMarker/Marker)."
        );
      });
    };

    renderMarkers();
    // ✅ NOTA: de propósito NÃO depende do onIssueSelect (evita piscar)
  }, [filteredIssues, mapLoaded]);

  const handleFilterChange = (filters: {
    category?: IssueCategory;
    status?: IssueStatus;
  }) => setSelectedFilters(filters);

  return (
    <div className={`relative ${height} w-full`}>
      {!GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Google Maps API Key Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Adiciona a tua Google Maps API key e Map ID em{" "}
              <code className="bg-gray-100 px-1 rounded">
                src/config/constants.ts
              </code>
              .
            </p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="h-full w-full" />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="bg-white p-4 rounded shadow-lg text-center">
            <p className="text-red-500 mb-2">{mapError}</p>
            <p className="text-sm text-gray-600">
              Confirma API key, Map ID, e “HTTP referrers” autorizados.
            </p>
          </div>
        </div>
      )}

      {mapLoaded && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {enableFilters && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white shadow-md border-0 hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-4">Filtrar Reports</h3>
                  <IssueFilterControl onChange={handleFilterChange} />
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* ✅ só logged-in consegue reportar */}
          {user && (
            <Link to="/report">
              <Button className="bg-white text-gray-700 hover:bg-gray-100 shadow-md border-0">
                <Plus className="h-4 w-4 mr-2" />
                Reportar
              </Button>
            </Link>
          )}
        </div>
      )}

      {mapLoaded && (
        <div className="absolute bottom-8 left-4 z-10 bg-white rounded-md shadow-md p-3">
          <div className="text-xs font-medium text-gray-500 mb-2">Estado:</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-700">Aberto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-700">Em progresso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span className="text-xs text-gray-700">Resolvido</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueMap;
