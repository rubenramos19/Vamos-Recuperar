import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AlertLevel = "yellow" | "orange" | "red" | "unknown";

type IpmaAlert = {
  id: string;
  title: string;
  level: AlertLevel;
  area: string; // vem como código do IPMA (ex: "LRA", "LIS", "AOC")
  startsAt?: string;
  endsAt?: string;
  sourceName?: string;
  sourceUrl?: string;
};

type Zone = "all" | "norte" | "centro" | "sul" | "ilhas" | "desconhecida";
type LevelFilter = "all" | "red" | "orange" | "yellow";

function levelBadge(level: AlertLevel) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  switch (level) {
    case "red":
      return `${base} bg-red-600 text-white`;
    case "orange":
      return `${base} bg-orange-600 text-white`;
    case "yellow":
      return `${base} bg-yellow-400 text-black`;
    default:
      return `${base} bg-muted text-foreground`;
  }
}

function levelLabel(level: AlertLevel) {
  if (level === "yellow") return "AMARELO";
  if (level === "orange") return "LARANJA";
  if (level === "red") return "VERMELHO";
  return "ALERTA";
}

function formatDateRange(startsAt?: string, endsAt?: string) {
  if (!startsAt && !endsAt) return null;

  // tenta format simples (ISO -> "YYYY-MM-DD HH:mm")
  const s = startsAt ? startsAt.replace("T", " ").slice(0, 16) : "";
  const e = endsAt ? endsAt.replace("T", " ").slice(0, 16) : "";
  if (s && e) return `${s} — ${e}`;
  return s || e;
}

function parseTimeMs(t?: string) {
  if (!t) return 0;
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? ms : 0;
}

// Mapeamento (códigos mais comuns do IPMA)
const AREA_NAME: Record<string, string> = {
  // Continente (distritos)
  AVE: "Aveiro",
  BEJ: "Beja",
  BGC: "Bragança",
  BRG: "Braga",
  CBR: "Coimbra",
  CAS: "Castelo Branco", // às vezes aparece como "CAS" em alguns feeds
  CBA: "Castelo Branco", // fallback
  EVR: "Évora",
  FAR: "Faro",
  GDA: "Guarda",
  LRA: "Leiria",
  LIS: "Lisboa",
  PRT: "Porto",
  SAN: "Santarém",
  SET: "Setúbal",
  STB: "Setúbal",
  VCT: "Viana do Castelo",
  VLR: "Vila Real",
  VSE: "Viseu",

  // Ilhas / regiões
  MAD: "Madeira",
  AOC: "Açores (Grupo Central)",
  AOR: "Açores (Grupo Oriental)",
  AOW: "Açores (Grupo Ocidental)",

  // Alguns feeds usam códigos diferentes — mantemos o “código” se não conhecermos
};

function areaDisplay(code: string) {
  const c = (code || "").toUpperCase().trim();
  return AREA_NAME[c] ? `${AREA_NAME[c]} (${c})` : c || "—";
}

function zoneFromAreaCode(code: string): Zone {
  const c = (code || "").toUpperCase().trim();

  // Ilhas
  if (c === "MAD" || c.startsWith("AO")) return "ilhas";

  // Norte (distritos)
  const norte = new Set(["VCT", "BRG", "PRT", "VLR", "BGC"]);
  if (norte.has(c)) return "norte";

  // Centro
  const centro = new Set(["AVE", "CBR", "VSE", "GDA", "LRA", "CAS", "CBA"]);
  if (centro.has(c)) return "centro";

  // Sul
  const sul = new Set(["LIS", "SAN", "SET", "STB", "EVR", "BEJ", "FAR"]);
  if (sul.has(c)) return "sul";

  return "desconhecida";
}

function severityScore(level: AlertLevel) {
  // mais alto = mais grave
  if (level === "red") return 3;
  if (level === "orange") return 2;
  if (level === "yellow") return 1;
  return 0;
}

export default function IpmaAlerts() {
  const [alerts, setAlerts] = useState<IpmaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros UI
  const [zone, setZone] = useState<Zone>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
          throw new Error("Faltam variáveis no .env: VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY");
        }

        // ✅ agora pedimos TUDO (sem q)
        const url = `${supabaseUrl}/functions/v1/ipma-alerts`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
        });

        const text = await res.text();

        if (!res.ok) throw new Error(`Edge Function ${res.status}: ${text}`);

        let data: { alerts: IpmaAlert[] };
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Resposta não é JSON válido. Recebi: ${text.slice(0, 200)}...`);
        }

        if (!cancelled) setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erro ao carregar alertas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = alerts.filter((a) => {
      const z = zoneFromAreaCode(a.area);
      if (zone !== "all" && z !== zone) return false;

      if (level !== "all" && a.level !== level) return false;

      if (q) {
        const areaName = areaDisplay(a.area).toLowerCase();
        const title = (a.title || "").toLowerCase();
        // pesquisa por título ou área
        if (!title.includes(q) && !areaName.includes(q) && !(a.area || "").toLowerCase().includes(q)) return false;
      }

      return true;
    });

    // ordenar por gravidade desc, depois por startTime desc
    filtered.sort((a, b) => {
      const s = severityScore(b.level) - severityScore(a.level);
      if (s !== 0) return s;
      return parseTimeMs(b.startsAt) - parseTimeMs(a.startsAt);
    });

    return filtered;
  }, [alerts, zone, level, query]);

  const visible = useMemo(() => processed.slice(0, visibleCount), [processed, visibleCount]);

  const hasMore = visibleCount < processed.length;

  // se o user mudar filtros/pesquisa, volta a “mostrar pouco”
  useEffect(() => {
    setVisibleCount(6);
  }, [zone, level, query]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="rounded-t-xl bg-orange-500 text-white">
        <CardTitle className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6" />
          <span>Alertas Ativos</span>
          <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-sm">
            {loading ? "…" : processed.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="bg-orange-500/10 p-6">
        {/* Filtros */}
        <div className="mb-5 rounded-xl bg-white/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/80">
            <Filter className="h-4 w-4" />
            Filtros
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* Zona */}
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Zona</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: "all", label: "Todas" },
                  { k: "norte", label: "Norte" },
                  { k: "centro", label: "Centro" },
                  { k: "sul", label: "Sul" },
                  { k: "ilhas", label: "Ilhas" },
                ].map((opt) => (
                  <Button
                    key={opt.k}
                    variant={zone === (opt.k as Zone) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setZone(opt.k as Zone)}
                    className="h-8"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Nível */}
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Nível</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: "all", label: "Todos" },
                  { k: "red", label: "Vermelho" },
                  { k: "orange", label: "Laranja" },
                  { k: "yellow", label: "Amarelo" },
                ].map((opt) => (
                  <Button
                    key={opt.k}
                    variant={level === (opt.k as LevelFilter) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevel(opt.k as LevelFilter)}
                    className="h-8"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Pesquisa */}
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Pesquisar</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Leiria, Porto, Vento, Chuva..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estado */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar alertas oficiais…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
            <div className="mt-2 text-sm text-muted-foreground">
              Dica: abre o DevTools → Console/Network para ver a resposta da função.
            </div>
          </div>
        )}

        {!loading && !error && processed.length === 0 && (
          <div className="text-muted-foreground">Sem alertas a mostrar com estes filtros.</div>
        )}

        {/* Lista */}
        <div className="mt-4 space-y-3">
          {visible.map((a) => {
            const range = formatDateRange(a.startsAt, a.endsAt);
            const zoneLabel = zoneFromAreaCode(a.area);
            return (
              <div key={a.id} className="rounded-xl bg-white/60 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={levelBadge(a.level)}>{levelLabel(a.level)}</span>

                  <div className="text-base font-semibold text-foreground">{a.title}</div>

                  <div className="text-sm text-muted-foreground">{areaDisplay(a.area)}</div>

                  <span className="ml-auto rounded-full bg-black/5 px-3 py-1 text-xs text-foreground/70">
                    {zoneLabel === "desconhecida" ? "Zona: —" : `Zona: ${zoneLabel.toUpperCase()}`}
                  </span>
                </div>

                {range && <div className="mt-2 text-sm text-muted-foreground">{range}</div>}

                {a.sourceUrl && (
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-foreground underline opacity-80 hover:opacity-100"
                  >
                    Fonte: {a.sourceName || "IPMA"} <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Ver mais / menos */}
        {!loading && !error && processed.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {hasMore ? (
              <Button onClick={() => setVisibleCount((n) => n + 10)} className="gap-2">
                Ver mais <ChevronDown className="h-4 w-4" />
              </Button>
            ) : (
              processed.length > 6 && (
                <Button variant="outline" onClick={() => setVisibleCount(6)} className="gap-2">
                  Mostrar menos <ChevronUp className="h-4 w-4" />
                </Button>
              )
            )}

            <div className="text-xs text-muted-foreground">
              A mostrar <strong>{Math.min(visibleCount, processed.length)}</strong> de{" "}
              <strong>{processed.length}</strong>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-muted-foreground">
          Fontes: IPMA • Alertas expiram automaticamente
        </div>
      </CardContent>
    </Card>
  );
}