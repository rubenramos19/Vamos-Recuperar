import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CommentsList({ postId, onChange }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setErrorMsg(null);
    try {
      // Fetch comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (commentsError) {
        console.error("Failed to load comments", commentsError);
        setErrorMsg(commentsError.message || String(commentsError));
        setComments([]);
        return;
      }

      const data = (commentsData as any) || [];
      // If there are user_ids, fetch profiles by user_id
      const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, user_id, name")
          .in("user_id", userIds);
        if (profilesError) {
          console.warn("Failed to load profiles for comments", profilesError);
        } else {
          (profilesData || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
      }

      // Attach profile info to comments
      const merged = data.map((c: any) => ({ ...c, profiles: profilesMap[c.user_id] || null }));
      console.debug("Comments load", { postId, count: merged.length, data: merged });
      setComments(merged);
    } catch (e) {
      console.error("Exception loading comments", e);
      setErrorMsg(String(e));
      setComments([]);
    }
  }

  useEffect(()=> { load(); }, [postId]);

  async function submit() {
    const userResp = await supabase.auth.getUser();
    const user = userResp.data.user;
    if (!user) return alert("Inicia sessão para comentar.");
    const { error } = await supabase.from("comments").insert([{ post_id: postId, user_id: user.id, content: text }]);
    if (error) {
      console.error("Failed to insert comment", error);
      alert("Erro ao enviar comentário: " + (error.message || error.code));
      return;
    }
    setText("");
    await load();
    onChange?.();
  }

  return (
    <div>
      <button onClick={async () => { setVisible(v => !v); if (!visible) await load(); }} className="text-sm text-primary">Comentários ({comments.length})</button>
      {errorMsg && <div className="text-sm text-red-600 mt-1">Erro: {errorMsg}</div>}
      {visible && (
        <div className="mt-2">
          {comments.length === 0 ? (
            <div className="text-sm py-1 text-gray-500">Sem comentários</div>
          ) : (
            comments.map(c => <div key={c.id} className="text-sm py-1 border-b"><strong>{c.profiles?.name || 'Anónimo'}:</strong> {c.content}</div>)
          )}
          <div className="flex gap-2 mt-2">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Escrever comentário..." className="flex-1 p-2 border rounded" />
            <button onClick={submit} className="px-3 bg-primary text-white rounded">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
