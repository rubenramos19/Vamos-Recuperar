import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // <- se der erro, troca pelo caminho correto
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type HelpType = "need" | "offer";
type Urgency = "low" | "medium" | "high";

export default function HelpRequestForm({ type }: { type: HelpType }) {
  const nav = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState("limpeza");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const suggestionTimeoutRef = useRef<any>(null);
  const [urgency, setUrgency] = useState<Urgency>("medium");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // simple validation helpers similar to reports
  const isTitleValid = (t: string) => t.trim().length >= 3;
  const isDescriptionValid = (d: string) => d.trim().length >= 10;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!user) {
      setMsg("Tens de fazer login para continuar.");
      nav("/login");
      return;
    }

    setLoading(true);

    // basic validations (same as reports)
    if (!isTitleValid(title)) {
      setLoading(false);
      setMsg("O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!isDescriptionValid(description)) {
      setLoading(false);
      setMsg("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }

    if (latitude == null || longitude == null) {
      setLoading(false);
      setMsg("Escolhe um ponto no mapa ou seleciona uma sugestão de localização.");
      return;
    }

    // insert using column names matching DB schema (snake_case)
    const { error } = await supabase.from("help_requests").insert({
      user_id: user.id,
      type,
      category,
      title,
      description,
      location_text: locationText,
      location_latitude: latitude ?? undefined,
      location_longitude: longitude ?? undefined,
      urgency,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setLocationText("");
    setUrgency("medium");

    // navigate back to home (map) so the new help-request is fetched and shown
    setMsg("✅ Enviado com sucesso. A mostrar no mapa...");
    try { window.dispatchEvent(new Event("help-request-added")); } catch {}
    setTimeout(() => {
      nav("/");
    }, 400);
  }

  useEffect(() => {
    let mounted = true;
    const initMap = async () => {
      if (!mapRef.current) return;
      try {
        const map = L.map(mapRef.current).setView([39.744, -8.807], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapInstanceRef.current = map;

        map.on("click", (ev: any) => {
          const lat = ev.latlng?.lat;
          const lng = ev.latlng?.lng;
          if (!lat || !lng) return;
          setLatitude(lat);
          setLongitude(lng);

          if (markerRef.current) {
            try { map.removeLayer(markerRef.current); } catch {}
            markerRef.current = null;
          }
          markerRef.current = L.circleMarker([lat, lng], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map);
        });
      } catch (err) {
        // fail silently
      }
    };

    initMap();
    return () => {
      mounted = false;
      try { if (markerRef.current) { mapInstanceRef.current?.removeLayer(markerRef.current); } } catch {}
      try { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } } catch {}
      try { if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current); } catch {}
    };
  }, []);

  // suggestions for Nominatim
  useEffect(() => {
    if (!locationText) { setSuggestions([]); return; }
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(locationText + ", Portugal");
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pt&q=${q}`;
        const res = await fetch(url, { headers: { "User-Agent": "leiria-resolve-app" } });
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 350);
  }, [locationText]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">
        {type === "need" ? "Pedir ajuda" : "Quero ajudar"}
      </h1>

      <p className="text-sm text-muted-foreground mb-4">
        {type === "need"
          ? "Descreve o que precisas. Pessoas na comunidade podem ajudar."
          : "Indica como podes ajudar. Quem precisar pode entrar em contacto."}
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <select className="w-full border rounded p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="limpeza">Limpeza</option>
          <option value="alimentacao">Alimentação</option>
          <option value="transporte">Transporte</option>
          <option value="alojamento">Alojamento</option>
          <option value="reparacoes">Reparações</option>
          <option value="outro">Outro</option>
        </select>

        <input
          className="w-full border rounded p-2"
          placeholder={type === "need" ? "Título (ex.: Preciso de ajuda a limpar garagem)" : "Título (ex.: Posso ajudar com transporte) "}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          className="w-full border rounded p-2"
          placeholder="Detalhes (o que aconteceu / o que consegues fazer / horários / quantas pessoas / etc.)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />

        <input
          ref={locationInputRef}
          className="w-full border rounded p-2"
          placeholder="Local (ex.: Marrazes, Centro, Parceiros...)"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />
        {suggestions.length > 0 && (
          <ul className="border rounded mt-1 max-h-40 overflow-auto bg-white">
            {suggestions.map((s, idx) => (
              <li
                key={s.place_id || idx}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  const lat = parseFloat(s.lat);
                  const lon = parseFloat(s.lon);
                  setLocationText(s.display_name || s.description || "");
                  setLatitude(lat);
                  setLongitude(lon);
                  setSuggestions([]);
                  try {
                    const map = mapInstanceRef.current;
                    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
                    markerRef.current = L.circleMarker([lat, lon], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map);
                    map.setView([lat, lon], 14);
                  } catch (err) {
                    // ignore
                  }
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}

        <div>
          <div className="text-sm text-muted-foreground mb-2">Escolhe um ponto no mapa (clique)</div>
          <div ref={mapRef} className="w-full h-48 rounded border" />
          <div className="text-sm mt-2">
            {latitude && longitude ? (
              <span>Localização escolhida: <strong>{latitude.toFixed(5)}, {longitude.toFixed(5)}</strong></span>
            ) : (
              <span className="text-muted-foreground">Nenhum ponto escolhido</span>
            )}
          </div>
        </div>

        <select className="w-full border rounded p-2" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
          <option value="low">Urgência baixa</option>
          <option value="medium">Urgência média</option>
          <option value="high">Urgência alta</option>
        </select>

        {msg && <div className="text-sm">{msg}</div>}

        <button className="w-full bg-black text-white rounded p-2" disabled={loading}>
          {loading ? "A enviar..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
