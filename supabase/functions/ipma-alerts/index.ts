// Para o VSCode parar de reclamar (o runtime do Supabase é Deno)
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type AlertLevel = "yellow" | "orange" | "red" | "unknown";

function mapLevel(level: string): AlertLevel {
  const l = (level || "").toLowerCase();
  if (l === "yellow") return "yellow";
  if (l === "orange") return "orange";
  if (l === "red") return "red";
  // IPMA também devolve "green" (sem alerta) -> tratamos como unknown para filtrar fora
  return "unknown";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const IPMA_URL = "https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json";

    // timeout (para não ficar pendurado)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(IPMA_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    }).finally(() => clearTimeout(t));

    if (!r.ok) return json({ alerts: [], error: `IPMA ${r.status}` }, 502);

    const raw = await r.json();
    const arr = Array.isArray(raw) ? raw : raw?.data ?? [];

    const alerts = arr
      .map((it: any) => {
        const areaCode = String(it?.idAreaAviso || "");
        const typeName = String(it?.awarenessTypeName || it?.awarenessType || "Aviso");
        const level = mapLevel(String(it?.awarenessLevelID || it?.awarenessLevel || ""));
        const start = it?.startTime ? String(it.startTime) : undefined;
        const end = it?.endTime ? String(it.endTime) : undefined;

        return {
          id: `${areaCode}-${typeName}-${start || ""}-${level}`,
          title: typeName,
          level,
          area: areaCode, // o IPMA devolve códigos (ex: LRA, BGC, ACE...)
          startsAt: start,
          endsAt: end,
          sourceName: "IPMA",
          sourceUrl: "https://www.ipma.pt/",
        };
      })
      // só amarelo/laranja/vermelho
      .filter((a: any) => a.level !== "unknown");

    // Devolve tudo
    return json({ alerts });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Timeout ao contactar IPMA" : (e?.message || String(e));
    return json({ alerts: [], error: msg }, 500);
  }
});
