import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIssues, IssueCategory, IssueStatus } from "@/contexts/IssueContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Filter } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import IssueFilterControl from "./IssueFilterControl";
import { logger } from "@/lib/logger";
import { useAuth } from "@/contexts/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

const LEIRIA_COORDINATES = { lat: 39.744, lng: -8.807 };

interface IssueMapProps {
  onIssueSelect?: (issueId: string) => void;
  height?: string;
  enableFilters?: boolean;
}

const IssueMap: React.FC<IssueMapProps> = ({ onIssueSelect, height = "h-[calc(100vh-64px)]", enableFilters = true }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const helpLayerRef = useRef<any>(null);

  const { issues } = useIssues();
  const { user } = useAuth();
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  
  const [selectedFilters, setSelectedFilters] = useState<{ category?: IssueCategory; status?: IssueStatus }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedFilters.category && issue.category !== selectedFilters.category) return false;
      if (selectedFilters.status && issue.status !== selectedFilters.status) return false;
      return true;
    });
  }, [issues, selectedFilters]);

  // helper to create a modern SVG marker as a divIcon
  const createSvgIcon = (color: string, innerSvg?: string, label?: string) => {
    const size = 36;
    const svg = innerSvg ?? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" fill="white"/>
      </svg>`;

    const html = `
      <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:18px;background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.25);">
        ${svg}
      </div>
      ${label ? `<div style=\"position:relative;top:-10px;left:12px;background:transparent;color:#fff;font-weight:700;\">${label}</div>` : ""}
    `;

    return L.divIcon({ html, className: "custom-div-icon", iconSize: [size, size], iconAnchor: [size/2, size/2] });
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    try {
      const map = L.map(mapContainer.current, { preferCanvas: true }).setView([LEIRIA_COORDINATES.lat, LEIRIA_COORDINATES.lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      helpLayerRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
    } catch (err) {
      logger.error("Error initializing Leaflet map:", err);
      setMapError("Falha ao inicializar o mapa Leaflet.");
    }

    return () => {
      try {
        if (mapRef.current) mapRef.current.remove();
        mapRef.current = null;
      } catch {}
    };
  }, []);

  // load help requests once
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase.from("help_requests").select("*").order("created_at", { ascending: false });
        const rows = (data as any) ?? [];

        // fetch profiles for authors of help requests in batch
        const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
        let profiles: any[] = [];
        if (userIds.length) {
          const resp = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", userIds);
          profiles = (resp.data as any) ?? [];
        }

        const enriched = rows.map((r: any) => ({ ...r, profile: profiles.find((p) => p.user_id === r.user_id) }));
        if (mounted) setHelpRequests(enriched);
      } catch (err) {
        console.warn("load help requests", err);
      }
    };
    load();
    // refresh when a new help request is added elsewhere
    const onNew = () => { load(); };
    window.addEventListener("help-request-added", onNew);

    return () => { mounted = false; window.removeEventListener("help-request-added", onNew); };
  }, []);

  // render markers and help markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // clear existing layers
    try { markersLayerRef.current && markersLayerRef.current.clearLayers(); } catch {}
    try { helpLayerRef.current && helpLayerRef.current.clearLayers(); } catch {}

    // issues markers
    filteredIssues.forEach((issue) => {
      const lat = Number(issue.location?.latitude);
      const lng = Number(issue.location?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = issue.status === "open" ? "#ef4444" : issue.status === "in_progress" ? "#f59e0b" : "#16a34a";

      const icon = createSvgIcon(color);
      const marker = L.marker([lat, lng], { icon }).addTo(markersLayerRef.current as any);
      marker.on("click", () => onIssueSelect?.(issue.id));
    });

    // help requests markers (red/green)
    helpRequests.forEach((req) => {
      const lat = Number(req.location_latitude ?? req.latitude ?? req.lat);
      const lng = Number(req.location_longitude ?? req.longitude ?? req.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const color = req.type === "need" ? "#ef4444" : "#16a34a";

      const hIcon = createSvgIcon(color);
      const marker = L.marker([lat, lng], { icon: hIcon }).addTo(helpLayerRef.current as any);

      // show a detailed popup when clicking a help marker
      marker.on("click", () => {
        const name = req.profile?.name ?? ""; // show name only when profile has a name
        const avatar = req.profile?.avatar_url
          ? `<img src=\"${req.profile.avatar_url}\" class=\"help-popup-avatar\" alt=\"avatar\"/>`
          : (() => {
              // choose icon svg by type
              const svgHome = `<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z\" fill=\"white\"/></svg>`;
              const svgAlert = `<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 9v4\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 17h.01\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M10.29 3.86L1.82 18.25A2 2 0 0 0 3.57 21h16.86a2 2 0 0 0 1.75-2.75L13.71 3.86a2 2 0 0 0-3.42 0z\" fill=\"white\"/></svg>`;
              const kind = req.type === "need" ? "need" : "offer";
              const svg = kind === "need" ? svgAlert : svgHome;
              return `<div class=\"help-popup-avatar help-popup-avatar--placeholder ${kind}\">${svg}</div>`;
            })();

        const titleHtml = req.title ? `<div class=\"help-popup-title\">${req.title}</div>` : "";
        const desc = req.description ? `<div class=\"help-popup-desc\">${req.description}</div>` : "";
        const time = req.created_at ? new Date(req.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "";
        const authorHtml = name ? `<div class=\"help-popup-author\"><strong>${name}</strong></div>` : "";
        const footer = `<div class=\"help-popup-footer\">${authorHtml}${time ? `<div class=\"help-popup-time\">${time}</div>` : ""}</div>`;

        const html = `
          <div class=\"help-popup-content\">
            <div class=\"help-popup-header\">${avatar}<div class=\"help-popup-meta\">${titleHtml}${desc}</div></div>
            ${footer}
          </div>
        `;

        const popup = L.popup({ className: `help-popup ${req.type === "need" ? "need" : "offer"}`, maxWidth: 360 })
          .setLatLng([lat, lng])
          .setContent(html);

        popup.openOn(mapRef.current);
      });
    });

  }, [filteredIssues, helpRequests, mapLoaded]);

  const handleFilterChange = (filters: { category?: IssueCategory; status?: IssueStatus }) => setSelectedFilters(filters);

  return (
    <div className={`relative ${height} w-full`}>
      <div ref={mapContainer} className="h-full w-full z-0" />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-[1300]">
          <div className="bg-white p-4 rounded shadow-lg text-center">
            <p className="text-red-500 mb-2">{mapError}</p>
          </div>
        </div>
      )}

      {mapLoaded && (
        <div className="absolute top-4 right-4 z-[1200] flex flex-col gap-2 items-end">

          {enableFilters && (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="bg-white shadow-md border-0 hover:bg-gray-100">
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
      

      <div className="absolute bottom-8 left-4 z-[1200] bg-white rounded-md shadow-md p-3">
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
    </div>
  );
};

export default IssueMap;

