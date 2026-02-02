import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  initialIndex?: number;
  title?: string;
};

export default function PhotoGalleryDialog({
  open,
  onOpenChange,
  photos,
  initialIndex = 0,
  title = "Fotos",
}: Props) {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const hasPhotos = photos?.length > 0;
  const canPrev = index > 0;
  const canNext = index < photos.length - 1;

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(photos.length - 1, i + 1));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base">
              {title} {hasPhotos ? `(${index + 1}/${photos.length})` : ""}
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px]">
          {/* Main */}
          <div className="relative bg-black">
            {hasPhotos ? (
              <img
                src={photos[index]}
                alt={`Foto ${index + 1}`}
                className="w-full h-[70vh] object-contain"
              />
            ) : (
              <div className="h-[50vh] flex items-center justify-center text-white/80">
                Sem fotos
              </div>
            )}

            {hasPhotos && photos.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2",
                    !canPrev && "opacity-50 pointer-events-none"
                  )}
                  onClick={prev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2",
                    !canNext && "opacity-50 pointer-events-none"
                  )}
                  onClick={next}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbs */}
          <div className="hidden md:block p-3 border-l bg-background">
            <div className="text-xs text-muted-foreground mb-2">Miniaturas</div>
            <div className="grid grid-cols-2 gap-2">
              {photos?.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "rounded-md overflow-hidden border hover:ring-2 hover:ring-ring transition",
                    i === index ? "ring-2 ring-ring" : ""
                  )}
                >
                  <img src={p} alt={`Miniatura ${i + 1}`} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
