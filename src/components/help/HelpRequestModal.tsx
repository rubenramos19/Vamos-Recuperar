import React from "react";
import IssueForm from "@/components/issues/IssueForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function HelpRequestModal({ open, onClose, type = "need" as "need" | "offer" }: { open: boolean; onClose: () => void; type?: "need" | "offer"; }) {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!open) return null;

  const handleSubmit = async (values: any) => {
    try {
      const payload: any = {
        user_id: user?.id ?? null,
        type,
        category: values.category,
        title: values.title,
        description: values.description,
        location_text: values.location?.address ?? "",
        latitude: values.location?.latitude,
        longitude: values.location?.longitude,
        urgency: (values as any).urgency ?? "medium",
        photos: values.photos ?? null,
      };

      const { error } = await supabase.from("help_requests").insert(payload);
      if (error) throw error;

      // notify map to refresh
      try { window.dispatchEvent(new Event("help-request-added")); } catch {}

      toast({ title: "Pedido de ajuda enviado", description: "O seu pedido de ajuda foi publicado no mapa." });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao enviar", description: err?.message || "Falha ao enviar pedido de ajuda." });
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pedir Ajuda</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Fechar</button>
        </div>
        <div className="p-4">
          <IssueForm onSubmit={handleSubmit} onSubmitSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}
