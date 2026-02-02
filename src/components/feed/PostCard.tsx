import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CommentsList from "@/components/feed/CommentsList";
import { format } from "date-fns";

export default function PostCard({ post, onChange }: any) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(()=> {
    async function load() {
      const { data: c } = await supabase.from("post_likes").select("id").eq("post_id", post.id);
      setLikes(c?.length || 0);
    }
    load();
  }, [post.id]);

  async function toggleLike() {
    const userResp = await supabase.auth.getUser();
    const user = userResp.data.user;
    if (!user) return alert("Inicia sessão para gostar.");
    if (liked) {
      await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
      setLiked(false);
      setLikes(l => l-1);
    } else {
      await supabase.from("post_likes").insert([{ post_id: post.id, user_id: user.id }]);
      setLiked(true);
      setLikes(l => l+1);
    }
    onChange?.();
  }

  return (
    <div className={`p-4 rounded border bg-white`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{post.title || ""}</h3>
          <div className="text-sm text-gray-600">{post.location_text || ""}</div>
        </div>
        <div className="text-sm text-gray-500">{post.created_at ? format(new Date(post.created_at), 'dd/MM/yyyy, HH:mm') : ""}</div>
      </div>
      <p className="mt-2 text-gray-800">{post.content}</p>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={toggleLike} className="px-3 py-1 rounded border">{liked ? "Gosto ✓" : "Gosto"} ({likes})</button>
        <CommentsList postId={post.id} onChange={onChange} />
      </div>
    </div>
  );
}
