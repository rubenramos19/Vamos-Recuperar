import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CommentsList({ postId, onChange }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const { data } = await supabase.from("comments").select("*, profiles(name)").eq("post_id", postId).order("created_at", { ascending: true });
    setComments((data as any) || []);
  }

  useEffect(()=> { load(); }, [postId]);

  async function submit() {
    const userResp = await supabase.auth.getUser();
    const user = userResp.data.user;
    if (!user) return alert("Inicia sessão para comentar.");
    await supabase.from("comments").insert([{ post_id: postId, user_id: user.id, content: text }]);
    setText("");
    await load();
    onChange?.();
  }

  return (
    <div>
      <button onClick={load} className="text-sm text-primary">Comentários ({comments.length})</button>
      <div className="mt-2">
        {comments.map(c => <div key={c.id} className="text-sm py-1 border-b"><strong>{c.profiles?.name || 'Anónimo'}:</strong> {c.content}</div>)}
        <div className="flex gap-2 mt-2">
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Escrever comentário..." className="flex-1 p-2 border rounded" />
          <button onClick={submit} className="px-3 bg-primary text-white rounded">Enviar</button>
        </div>
      </div>
    </div>
  );
}
