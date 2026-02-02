import React from "react";
import { Issue, IssueStatus, useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  User,
  Clock,
  Edit,
  Trash,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PhotoGalleryDialog from "@/components/issues/PhotoGalleryDialog";
import { cn } from "@/lib/utils";

interface IssueDetailProps {
  issue: Issue;
}

const LEIRIA_ZOOM_DELTA = 0.002;

const IssueDetail: React.FC<IssueDetailProps> = ({ issue }) => {
  const { user, isAdmin } = useAuth();
  const { updateIssue, deleteIssue } = useIssues();
  const { toast } = useToast();
  const navigate = useNavigate();

  const photos: string[] = issue?.photos ?? [];

  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [galleryIndex, setGalleryIndex] = React.useState(0);

  const openGalleryAt = (i: number) => {
    setGalleryIndex(i);
    setGalleryOpen(true);
  };

  const formatDate = (dateString: string) => format(new Date(dateString), "PPP");
  const formatTime = (dateString: string) => format(new Date(dateString), "p");

  const formatCategory = (category: string) =>
    category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const canEdit = user && (isAdmin() || user.id === issue.reporterId);

  const handleStatusUpdate = (newStatus: IssueStatus) => {
    updateIssue(issue.id, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `Issue status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const handleDelete = () => {
    deleteIssue(issue.id);
    toast({ title: "Issue Deleted", description: "The issue has been deleted successfully" });
    navigate("/");
  };

  const locationLabel =
    issue.location.address?.trim()
      ? issue.location.address
      : `${issue.location.latitude.toFixed(6)}, ${issue.location.longitude.toFixed(6)}`;

    const googleMapsLink = `https://www.google.com/maps?q=${issue.location.latitude},${issue.location.longitude}`;

  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
    issue.location.longitude - LEIRIA_ZOOM_DELTA
  }%2C${issue.location.latitude - LEIRIA_ZOOM_DELTA}%2C${
    issue.location.longitude + LEIRIA_ZOOM_DELTA
  }%2C${issue.location.latitude + LEIRIA_ZOOM_DELTA}&layer=mapnik&marker=${
    issue.location.latitude
  }%2C${issue.location.longitude}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-snug break-words">
              {issue.title}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {getStatusBadge(issue.status)}
              <Badge variant="secondary">{formatCategory(issue.category)}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">Local</div>
                <div className="break-words">{locationLabel}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">Reportado por</div>
                <div className="break-words">{issue.reporterName}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">Data</div>
                <div>
                  {formatDate(issue.createdAt)}{" "}
                  <span className="text-muted-foreground">•</span>{" "}
                  {formatTime(issue.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {issue.createdAt !== issue.updatedAt && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-muted-foreground text-xs">Atualizado</div>
                  <div>
                    {formatDate(issue.updatedAt)}{" "}
                    <span className="text-muted-foreground">•</span>{" "}
                    {formatTime(issue.updatedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-5">
          <div className="text-sm text-muted-foreground mb-2">Descrição</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Fotos</div>
            {photos.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {photos.length} foto{photos.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {photos.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem fotos.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openGalleryAt(i)}
                  className={cn(
                    "rounded-lg overflow-hidden border hover:ring-2 hover:ring-ring transition",
                  )}
                >
                  <img src={p} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover" />
                </button>
              ))}

              {photos.length > 4 && (
                <button
                  type="button"
                  onClick={() => openGalleryAt(0)}
                  className="rounded-lg border h-28 flex items-center justify-center text-sm text-muted-foreground hover:ring-2 hover:ring-ring transition"
                >
                  +{photos.length - 4} mais
                </button>
              )}
            </div>
          )}

          <PhotoGalleryDialog
            open={galleryOpen}
            onOpenChange={setGalleryOpen}
            photos={photos}
            initialIndex={galleryIndex}
            title="Fotos"
          />
        </CardContent>
      </Card>

      {/* Map preview */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Localização</div>
<Button asChild variant="outline" size="sm">
  <a href={googleMapsLink} target="_blank" rel="noreferrer">
    Abrir no Google Maps <ExternalLink className="h-4 w-4 ml-2" />
  </a>
</Button>

          </div>

          <div className="h-56 rounded-lg overflow-hidden border bg-muted">
            <iframe
              title="Issue Location"
              width="100%"
              height="100%"
              frameBorder={0}
              src={embedSrc}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin actions */}
      {isAdmin() && (
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm font-medium mb-3">Admin</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={issue.status === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate("open")}
                disabled={issue.status === "open"}
              >
                Open
              </Button>
              <Button
                variant={issue.status === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate("in_progress")}
                disabled={issue.status === "in_progress"}
              >
                In Progress
              </Button>
              <Button
                variant={issue.status === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate("resolved")}
                disabled={issue.status === "resolved"}
              >
                Resolved
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit/Delete */}
      {canEdit && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/edit-issue/${issue.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <Trash className="h-4 w-4 mr-2" />
                Apagar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isto vai apagar o reporte permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
