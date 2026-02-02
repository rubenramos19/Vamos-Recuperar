import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function PostForm({ onPublished }: { onPublished?: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [eventAt, setEventAt] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const userResp = await supabase.auth.getUser();
    const user = userResp.data.user;
    if (!user) return alert("É necessário iniciar sessão para publicar.");
    const { error } = await supabase.from("posts").insert([{
      user_id: user.id,
      title,
      content,
      is_event: isEvent,
      event_at: eventAt || null,
    }]);
    if (error) {
      console.error("Failed to insert post", error);
      alert("Erro ao publicar: " + (error.message || error.code));
      return;
    }
    setTitle(""); setContent(""); setIsEvent(false); setEventAt("");
    onPublished?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
      <input placeholder="Título (opcional)" value={title} onChange={e=>setTitle(e.target.value)} className="w-full mb-2 p-2 border rounded" />
      <textarea placeholder="O que queres publicar? (ex.: organizar um encontro)" value={content} onChange={e=>setContent(e.target.value)} className="w-full p-2 border rounded mb-2" />
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isEvent} onChange={e=>setIsEvent(e.target.checked)} />
          Evento
        </label>
        {isEvent && <input type="datetime-local" value={eventAt} onChange={e=>setEventAt(e.target.value)} className="p-2 border rounded" />}
      </div>
      <div className="text-right">
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Publicar</button>
      </div>
    </form>
  );
}
