import React, { useEffect, useRef } from "react";
import { useIssues } from "@/contexts/IssueContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Approx bounds covering mainland Portugal; used as fallback/default
const PORTUGAL_BOUNDS = {
  south: 36.8,
  west: -9.6,
  north: 42.2,
  east: -6.0,
};

interface HeatMapPreviewProps {
  height?: string;
}

const HeatMapPreview: React.FC<HeatMapPreviewProps> = ({ height = "h-64" }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const labelMarkersRef = useRef<any[]>([]);

  const { issues } = useIssues();

  useEffect(() => {
    let mounted = true;
    const init = () => {
      if (!containerRef.current) return;

      try {
        const center = [(PORTUGAL_BOUNDS.south + PORTUGAL_BOUNDS.north) / 2, (PORTUGAL_BOUNDS.west + PORTUGAL_BOUNDS.east) / 2];
        const map = L.map(containerRef.current).setView(center as any, 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;

        // prepare heatmap points with weights
        const pointsRaw = issues
          .map((issue) => {
            const lat = Number(issue.location?.latitude);
            const lng = Number(issue.location?.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const weight = issue.status === "open" ? 2 : issue.status === "in_progress" ? 1 : 0.6;
            return { lat, lng, weight };
          })
          .filter(Boolean) as { lat: number; lng: number; weight: number }[];

        if ((L as any).heatLayer) {
          try {
            const heatPoints = pointsRaw.map((p) => [p.lat, p.lng, p.weight]);
            const heat = (L as any).heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
            heatmapRef.current = heat;
          } catch (err) {
            // fallback below
          }
        }

        // Fit bounds to points if we have any, otherwise use Portugal bounds
        if (pointsRaw.length > 0) {
          const latlngs = pointsRaw.map((p) => [p.lat, p.lng]);
          const bounds = L.latLngBounds(latlngs as any);
          map.fitBounds(bounds.pad(0.1));
        } else {
          map.fitBounds([[PORTUGAL_BOUNDS.south, PORTUGAL_BOUNDS.west], [PORTUGAL_BOUNDS.north, PORTUGAL_BOUNDS.east]] as any);
        }

        // Compute simple clustering by rounding coords to 2 decimal places
        const clusters = new Map<string, { sumLat: number; sumLng: number; weight: number; count: number }>();
        pointsRaw.forEach((p) => {
          const keyLat = Math.round(p.lat * 100) / 100;
          const keyLng = Math.round(p.lng * 100) / 100;
          const key = `${keyLat}_${keyLng}`;
          const entry = clusters.get(key);
          if (entry) {
            entry.sumLat += p.lat;
            entry.sumLng += p.lng;
            entry.weight += p.weight;
            entry.count += 1;
          } else {
            clusters.set(key, { sumLat: p.lat, sumLng: p.lng, weight: p.weight, count: 1 });
          }
        });

        // pick top 5 clusters by weight/count
        const clusterArray = Array.from(clusters.entries()).map(([k, v]) => ({ key: k, avgLat: v.sumLat / v.count, avgLng: v.sumLng / v.count, weight: v.weight, count: v.count }));
        clusterArray.sort((a, b) => b.weight - a.weight);
        const topClusters = clusterArray.slice(0, 5);

        // add Circle and label marker for each top cluster
        topClusters.forEach((c) => {
          try {
            const circle = L.circle([c.avgLat, c.avgLng], {
              color: "#ff5722",
              weight: 1,
              fillColor: "#ff5722",
              fillOpacity: 0.15,
              radius: Math.min(8000 + c.count * 2000, 30000),
            }).addTo(map);
            circlesRef.current.push(circle as any);

            const labelHtml = `<div class="bg-white/90 text-sm text-primary px-2 py-1 rounded shadow font-semibold">${c.count} ocorrências</div>`;
            const divIcon = L.divIcon({ html: labelHtml });
            const marker = L.marker([c.avgLat, c.avgLng], { icon: divIcon as any }).addTo(map);
            labelMarkersRef.current.push(marker as any);
          } catch (err) {
            // ignore overlay errors
          }
        });
      } catch (err) {
        console.warn("HeatMapPreview init error:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        circlesRef.current.forEach((c) => { try { (c as any).remove(); } catch {} });
        circlesRef.current = [];
      } catch {}
      try {
        labelMarkersRef.current.forEach((m) => { try { (m as any).remove(); } catch {} });
        labelMarkersRef.current = [];
      } catch {}
      try {
        if (heatmapRef.current) { try { (heatmapRef.current as any).remove(); } catch {} }
      } catch {}
      try {
        if (mapRef.current) { try { (mapRef.current as any).remove(); } catch {} }
      } catch {}
    };
  }, [issues]);

  return (
    <div className={`${height} w-full rounded-md overflow-hidden bg-gray-100`}>
      {/* HeatMapPreview is now a simple preview of issues-only heatmap; IPMA toggle removed */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default HeatMapPreview;
