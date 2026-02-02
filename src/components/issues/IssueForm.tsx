import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { IssueCategory, IssueStatus } from "@/contexts/IssueContext";
import { useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Camera, X, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { GoogleVisionService as ImageVerificationService } from "@/services/googleVisionService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Constants for validation
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGES = 5;
const MAX_ISSUES_PER_HOUR = 5;

const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: "O título deve ter pelo menos 3 caracteres." })
    .max(200, { message: "O título deve ter menos de 200 caracteres." }),
  description: z
    .string()
    .min(10, { message: "A descrição deve ter pelo menos 10 caracteres." })
    .max(2000, { message: "A descrição deve ter menos de 2000 caracteres." }),
  category: z.enum([
    "limpeza",
    "alimentacao",
    "transporte",
    "alojamento",
    "reparacoes",
    "outro",
  ]),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  photos: z
    .array(z.string())
    .max(MAX_IMAGES, {
      message: `Podes enviar no máximo ${MAX_IMAGES} fotos.`,
    })
    .optional(),
});

interface IssueFormProps {
  issueId?: string;
  defaultValues?: z.infer<typeof formSchema>;
  onSubmit?: (values: z.infer<typeof formSchema>) => void;
  onSubmitSuccess?: () => void;
}

const IssueForm: React.FC<IssueFormProps> = ({
  issueId,
  defaultValues,
  onSubmit,
  onSubmitSuccess,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addIssue, updateIssue } = useIssues();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [photoVerifications, setPhotoVerifications] = useState<{
    [key: number]: { isValid: boolean; confidence: number; reason?: string };
  }>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<any>(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const suggestionTimeoutRef = useRef<any>(null);

  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      category: "limpeza",
      location: { latitude: 0, longitude: 0 },
      photos: [],
    },
    mode: "onChange",
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const description = form.getValues("description");
    const category = form.getValues("category");

    if (!description || description.length < 10) {
      toast({
        variant: "destructive",
        title: "Descrição necessária",
        description: "Por favor fornece uma descrição detalhada antes de enviar fotos para verificação.",
      });
      return;
    }

    if (photos.length >= MAX_IMAGES) {
      toast({
        variant: "destructive",
        title: "Máximo de fotos atingido",
        description: `Só podes enviar até ${MAX_IMAGES} fotos por report.`,
      });
      return;
    }

    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > MAX_IMAGE_SIZE
    );
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Ficheiro muito grande",
        description: `Cada imagem deve ter menos de 5MB. ${oversizedFiles.length} ficheiro(s) excederam este limite.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newPhotos = Array.from(files).slice(0, MAX_IMAGES - photos.length);
    setIsVerifying(true);

    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const photoIndex = photos.length + i;

        try {
          // Verification disabled (como tinhas)
          let verification = {
            isValid: true,
            confidence: 100,
            reason: "Verificação desativada",
          };

          // Se quiseres reativar no futuro:
          // verification = await ImageVerificationService.verifyImage(result, description, category);

          setPhotoVerifications((prev) => ({
            ...prev,
            [photoIndex]: verification,
          }));

          if (verification.isValid) {
            setPhotos((prev) => {
              const updated = [...prev, result].slice(0, MAX_IMAGES);
              form.setValue("photos", updated);
              return updated;
            });

            toast({
              title: "Imagem adicionada",
              description: verification.reason || "Imagem adicionada com sucesso.",
            });
          } else {
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast({
              variant: "destructive",
              title: "Imagem irrelevante",
              description: verification.reason || "A imagem enviada não corresponde à descrição.",
              action: (
                <ToastAction
                  altText="Re-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Re-enviar
                </ToastAction>
              ),
            });
            setTimeout(() => fileInputRef.current?.click(), 600);
          }
        } catch (error) {
          logger.error("Verification error:", error);
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast({
            variant: "destructive",
            title: "Verificação indisponível",
            description: "Não foi possível verificar a imagem. Por favor tenta novamente.",
            action: (
              <ToastAction
                altText="Re-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                Re-enviar
              </ToastAction>
            ),
          });
          setTimeout(() => fileInputRef.current?.click(), 600);
        }

        if (i === newPhotos.length - 1) setIsVerifying(false);
      };

      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      form.setValue("photos", updated);
      return updated;
    });

    setPhotoVerifications((prev) => {
      const updated = { ...prev };
      delete updated[index];

      const reindexed: typeof updated = {};
      Object.keys(updated).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) reindexed[oldIndex - 1] = updated[oldIndex];
        else if (oldIndex < index) reindexed[oldIndex] = updated[oldIndex];
      });
      return reindexed;
    });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalização não suportada",
        description: "O teu browser não suporta geolocalização.",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setShowLocationConfirm(true);
        setIsLoadingLocation(false);
      },
      () => {
        setIsLoadingLocation(false);
        toast({
          variant: "destructive",
          title: "Acesso à localização negado",
          description: "Ativa as permissões de localização para usar esta funcionalidade.",
        });
      }
    );
  };

  const confirmUseCurrentLocation = async () => {
    if (!currentPosition || !map.current) return;

    const { latitude, longitude } = currentPosition;

    setLocation({ latitude, longitude });
    form.setValue("location.latitude", latitude);
    form.setValue("location.longitude", longitude);
    form.setValue("location.address", "Current Location");

    try {
      if (map.current.currentMarker) {
        try { map.current.removeLayer(map.current.currentMarker); } catch {}
        map.current.currentMarker = null;
      }
      const marker = L.circleMarker([latitude, longitude], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 });
      marker.addTo(map.current);
      map.current.currentMarker = marker;
      map.current.setView([latitude, longitude], 16);
    } catch (err) {
      // ignore
    }

    setShowLocationConfirm(false);
    toast({ title: "Local definido", description: "A tua localização atual foi definida como local do problema." });
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        const center: [number, number] = [39.744, -8.807];
        const m = L.map(mapContainer.current).setView(center, 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(m);

        map.current = m;
        setMapLoaded(true);

        m.on("click", (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;

          setLocation({ latitude: lat, longitude: lng });
          form.setValue("location.latitude", lat);
          form.setValue("location.longitude", lng);

          if (map.current.currentMarker) {
            try { map.current.removeLayer(map.current.currentMarker); } catch {}
            map.current.currentMarker = null;
          }

          const marker = L.circleMarker([lat, lng], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map.current);
          map.current.currentMarker = marker;
        });
      } catch (error) {
        logger.error("Error initializing Leaflet map:", error);
      }
    };

    initializeMap();

    return () => {
      try { if (map.current?.currentMarker) { map.current.removeLayer(map.current.currentMarker); } } catch {}
      try { if (map.current) { map.current.remove(); map.current = null; } } catch {}
    };
  }, [form]);

  useEffect(() => {
    const updateMapLocation = async () => {
      if (defaultValues && map.current && mapLoaded) {
        const { latitude, longitude } = defaultValues.location;
        setLocation({ latitude, longitude });

        try {
          if (map.current.currentMarker) { map.current.removeLayer(map.current.currentMarker); map.current.currentMarker = null; }
          const marker = L.circleMarker([latitude, longitude], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map.current);
          map.current.currentMarker = marker;
          map.current.setView([latitude, longitude], 15);
        } catch (err) {
          // ignore
        }
      }
    };

    updateMapLocation();
  }, [defaultValues, mapLoaded]);

  // Nominatim suggestions for searchText
  useEffect(() => {
    if (!searchText) { setSuggestions([]); return; }
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(searchText + ", Portugal");
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pt&q=${q}`;
        const res = await fetch(url, { headers: { "User-Agent": "leiria-resolve-app" } });
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);
  }, [searchText]);


  async function onSubmitHandler(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const isLoggedIn = !!user?.id;

      const reporterId = isLoggedIn ? user!.id : null;
      const reporterName = isLoggedIn ? (user!.name ?? "Anonymous") : "Anónimo";
      const reporterEmail = isLoggedIn ? (user!.email ?? null) : null;

      // ✅ email verification só para logged
      if (!issueId && isLoggedIn && !user!.emailVerified) {
        toast({
          variant: "destructive",
          title: "Email Verification Required",
          description: "Please verify your email address before reporting issues.",
        });
        return;
      }

      // ✅ rate limit só para logged
      if (!issueId && isLoggedIn) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { count, error: countError } = await supabase
          .from("issues")
          .select("*", { count: "exact", head: true })
          .eq("reporter_id", user!.id)
          .gte("created_at", oneHourAgo);

        if (!countError && count && count >= MAX_ISSUES_PER_HOUR) {
          toast({
            variant: "destructive",
            title: "Rate Limit Exceeded",
            description: `You can only report ${MAX_ISSUES_PER_HOUR} issues per hour. Please try again later.`,
          });
          return;
        }
      }

      const issueData = {
        title: values.title,
        description: values.description,
        category: values.category,
        reporterId,
        reporterName,
        reporterEmail,
        status: "open" as IssueStatus,
        location: {
          latitude: values.location.latitude,
          longitude: values.location.longitude,
          address: values.location.address || "Sem morada",
        },
        photos,
          isPublic: values.isPublic ?? true,
      };

      if (issueId) {
        await updateIssue(issueId, issueData);
        toast({
          title: "Report atualizado",
          description: "O teu report foi atualizado com sucesso.",
        });
      } else {
        await addIssue(issueData);
        toast({
          title: "Report enviado",
          description: "O teu report foi enviado com sucesso.",
        });
      }

      onSubmit?.(values);

      if (onSubmitSuccess) onSubmitSuccess();
      else navigate("/");
    } catch (error: any) {
      logger.error("Error submitting issue:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reportar",
        description: error?.message || "Falha ao enviar o report. Por favor tenta novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{issueId ? "Editar report" : "Reportar um problema"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título (ex.: Preciso de ajuda a limpar garagem)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes (o que aconteceu / o que consegues fazer / horários / quantas pessoas / etc.)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <div className="relative z-50">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleciona uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="alimentacao">Alimentação</SelectItem>
                        <SelectItem value="transporte">Transporte</SelectItem>
                        <SelectItem value="alojamento">Alojamento</SelectItem>
                        <SelectItem value="reparacoes">Reparações</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Map Location Selection */}
            <div className="w-full">
              <Label>Selecionar local no mapa</Label>

              <div className="mb-4 space-y-2">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Pesquisar local..."
                  className="w-full"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {suggestions.length > 0 && (
                  <ul className="border rounded mt-1 max-h-40 overflow-auto bg-white relative z-50">
                    {suggestions.map((s, idx) => (
                      <li
                        key={s.place_id || idx}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          const lat = parseFloat(s.lat);
                          const lon = parseFloat(s.lon);
                          const addr = s.display_name || s.description || "";
                          setSearchText(addr);
                          setLocation({ latitude: lat, longitude: lon, address: addr });
                          form.setValue("location.latitude", lat);
                          form.setValue("location.longitude", lon);
                          form.setValue("location.address", addr);
                          setSuggestions([]);
                          try {
                            if (map.current.currentMarker) { map.current.removeLayer(map.current.currentMarker); map.current.currentMarker = null; }
                            const marker = L.circleMarker([lat, lon], { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9 }).addTo(map.current);
                            map.current.currentMarker = marker;
                            map.current.setView([lat, lon], 15);
                          } catch (err) {
                            // ignore
                          }
                        }}
                      >
                        {s.display_name}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Escreve o nome do local ou morada, depois clica no mapa para ajustar
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                    {isLoadingLocation ? "A obter localização..." : "Usar a minha localização"}
                  </Button>
                </div>
              </div>

              <div ref={mapContainer} className="h-64 rounded border z-0 relative" />
            </div>

            {/* Photo Upload Section */}
            <div>
              <Label>Fotos (Opcional - Máx 5, 5MB cada)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                As fotos serão verificadas automaticamente relativamente à descrição.
              </p>

              <div className="mt-2">
                {photos.length < MAX_IMAGES && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors",
                      isVerifying && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isVerifying
                        ? "A verificar imagens..."
                        : `Clica para enviar fotos (${photos.length}/${MAX_IMAGES})`}
                    </p>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />

                        {photoVerifications[index] && (
                          <div
                            className={cn(
                              "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              photoVerifications[index].isValid
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            )}
                          >
                            {photoVerifications[index].isValid ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Verificado
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Falhou
                              </>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {photoVerifications[index] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 rounded-b-lg">
                            {photoVerifications[index].reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            

            <Button type="submit" disabled={isSubmitting || isVerifying}>
              {isSubmitting ? "A enviar..." : isVerifying ? "A verificar imagens..." : "Enviar"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <AlertDialog open={showLocationConfirm} onOpenChange={setShowLocationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usar localização atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Desejas definir a tua localização atual como o local do problema?
              {currentPosition && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Coordenadas: {currentPosition.latitude.toFixed(6)},{" "}
                  {currentPosition.longitude.toFixed(6)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUseCurrentLocation}>
              Sim, usar esta localização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default IssueForm;
