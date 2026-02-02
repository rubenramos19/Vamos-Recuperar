import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PostForm from "@/components/feed/PostForm";
import PostCard from "@/components/feed/PostCard";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*, post_media(url), comments(id)")
      .order("created_at", { ascending: false });
    setPosts((data as any) || []);
  }

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Feed — Publicações</h1>
      <PostForm onPublished={fetchPosts} />
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <div className="p-6 bg-white border rounded text-center text-gray-600">Sem publicações — Seja o primeiro a publicar.</div>
        ) : (
          posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
