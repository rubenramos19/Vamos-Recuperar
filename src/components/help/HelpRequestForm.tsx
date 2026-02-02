import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // <- se der erro, troca pelo caminho correto

type HelpType = "need" | "offer";
type Urgency = "low" | "medium" | "high";

export default function HelpRequestForm({ type }: { type: HelpType }) {
  const nav = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState("limpeza");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!user) {
      setMsg("Tens de fazer login para continuar.");
      nav("/login");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("help_requests").insert({
      user_id: user.id,
      type,
      category,
      title,
      description,
      location_text: locationText,
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

    setMsg("✅ Enviado com sucesso. Obrigado! 🙌");
  }

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
          className="w-full border rounded p-2"
          placeholder="Local (ex.: Marrazes, Centro, Parceiros...)"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />

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
