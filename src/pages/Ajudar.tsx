import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import HelpDetailModal from "@/components/help/HelpDetailModal";

type HelpItem = {
  id: string;
  user_id: string | null;
  type: "need" | "offer";
  title: string;
  description?: string;
  location_text?: string;
  urgency?: string;
  created_at?: string;
};

export default function Ajudar() {
  const [items, setItems] = useState<HelpItem[]>([]);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | "need" | "offer">("all");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("help_requests").select("*").order("created_at", { ascending: false });
      setLoading(false);
      if (error) {
        console.warn("fetch help_requests", error.message);
        return;
      }
      if (mounted) setItems((data as any) ?? []);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const need = items.filter((i) => i.type === "need").length;
    const offer = items.filter((i) => i.type === "offer").length;
    return { need, offer };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterType !== "all" && it.type !== filterType) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        (it.title ?? "").toLowerCase().includes(s) ||
        (it.description ?? "").toLowerCase().includes(s) ||
        (it.location_text ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q, filterType]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Ajuda — Plataforma de Apoio</h1>
        <p className="text-muted-foreground mt-2">Encontra pedidos ou oferece ajuda após a tempestade.</p>
      </div>

      {/* Large stats card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
          <div className="flex flex-col items-center lg:items-center text-center">
            <div className="text-6xl font-extrabold text-red-600">{counts.need}</div>
            <div className="text-sm text-muted-foreground mt-2">Pedidos de Ajuda</div>
            <div className="mt-4 w-full lg:w-3/4">
              <Link to="/report">
                <Button className="w-full bg-white text-red-600 border-2 border-red-600 hover:bg-red-50 rounded-full px-6 py-3">Pedir Ajuda</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-center text-center">
            <div className="text-6xl font-extrabold text-emerald-600">{counts.offer}</div>
            <div className="text-sm text-muted-foreground mt-2">Querem Ajudar</div>
            <div className="mt-4 w-full lg:w-3/4">
              <Link to="/quero-ajudar">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-3">Quero Ajudar</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons moved inside the stats card */}

      {/* Tabs */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button onClick={() => setFilterType("need")} className={`px-5 py-2 rounded-full ${filterType === "need" ? "bg-red-50 border border-red-200 text-red-700" : "bg-gray-100 text-gray-600"}`}>
          Preciso de Ajuda ({counts.need})
        </button>
        <button onClick={() => setFilterType("offer")} className={`px-5 py-2 rounded-full ${filterType === "offer" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
          Quero Ajudar ({counts.offer})
        </button>
      </div>

      {/* Search + filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={filterType === "offer" ? "Pesquisar quem quer ajudar..." : "Pesquisar pedidos de ajuda..."}
          className="flex-1 border rounded-lg p-3 shadow-sm"
        />
        <div className="flex gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="border rounded-lg p-3">
            <option value="all">Todos</option>
            <option value="need">Preciso de Ajuda</option>
            <option value="offer">Quero Ajudar</option>
          </select>
        </div>
      </div>

      {/* Card grid */}
      <div>
        {loading && <div className="text-sm text-muted-foreground">A carregar...</div>}
        {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">Sem resultados.</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((it) => (
            <div key={it.id} className={`rounded-lg border-2 ${it.type === "need" ? "border-red-100 bg-red-50/40" : "border-emerald-100 bg-emerald-50/30"} p-4 shadow-sm`}> 
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm inline-block px-2 py-1 rounded-full bg-white/60 text-gray-700">{it.urgency ?? ""}</div>
                  </div>

                  <div className="text-lg font-semibold mb-1">{it.title}</div>
                  <div className="text-sm text-muted-foreground mb-3">{it.location_text}</div>
                  <div className="text-sm text-slate-700 mb-4">{it.description}</div>
                </div>

                <div className="text-right ml-4">
                  <div className={`text-sm font-semibold ${it.type === "need" ? "text-red-600" : "text-emerald-600"}`}>{it.type === "need" ? "Pedido" : "Oferta"}</div>
                  <div className="text-xs text-muted-foreground">{it.created_at ? new Date(it.created_at).toLocaleString("pt-PT") : ""}</div>
                </div>
              </div>

              <div className="mt-4">
                <button onClick={() => { setSelected(it); setModalOpen(true); }} className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-md ${it.type === "need" ? "border border-red-400 text-red-600 bg-white" : "bg-emerald-600 text-white"}`}>
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <HelpDetailModal open={modalOpen} onClose={() => setModalOpen(false)} item={selected} />
    </div>
  );
}
