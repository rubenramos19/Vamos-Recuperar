import React from "react";

export default function HelpDetailModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: any | null; }) {
  if (!open || !item) return null;

  const name = item.profile?.name ?? "";
  const time = item.created_at ? new Date(item.created_at).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" }) : "";
  const kind = item.type === "need" ? "need" : "offer";

  const avatar = item.profile?.avatar_url
    ? <img src={item.profile.avatar_url} className="help-popup-avatar" alt="avatar" />
    : <div className={`help-popup-avatar help-popup-avatar--placeholder ${kind}`}>{name ? name.charAt(0) : ''}</div>;

  return (
    <div className="fixed inset-0 z-[1500] flex items-start justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-lg mt-12 mb-12">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Detalhes da ocorrência</h2>
          <button onClick={onClose} className="text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-extrabold text-slate-800">{item.title}</div>
            <div className="flex items-center gap-2 ml-4">
              {item.status && <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'open' || item.status === 'Aberto' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{item.status === 'open' ? 'Aberto' : item.status}</span>}
              {item.category && <span className="px-3 py-1 rounded-full text-sm bg-emerald-600 text-white">{item.category}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-muted-foreground">Local</div>
              <div className="mt-2 text-sm text-slate-700">{item.location_text ?? 'Sem morada'}</div>
            </div>

            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-muted-foreground">Reportado por</div>
              <div className="mt-2 text-sm text-slate-700">{name || 'Anónimo'}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-muted-foreground">Data</div>
              <div className="mt-2 text-sm text-slate-700">{time}</div>
            </div>
            <div className="p-4 border rounded bg-white">
              {/* placeholder for additional metadata if desired */}
            </div>
          </div>

          <div className="mt-6 p-4 border rounded bg-white">
            <div className="text-sm font-medium mb-2">Descrição</div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{item.description}</div>
          </div>

          <div className="mt-6 p-4 border rounded bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">Fotos</div>
              <div className="text-xs text-muted-foreground">{Array.isArray(item.photos) ? `${item.photos.length} foto${item.photos.length !== 1 ? 's' : ''}` : item.photos ? '1 foto' : '0 fotos'}</div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {(Array.isArray(item.photos) ? item.photos : item.photos ? [item.photos] : []).map((p: string, i: number) => (
                <div key={i} className="flex-shrink-0 w-64 h-28 rounded overflow-hidden bg-gray-50">
                  <img src={p} alt={`foto-${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
