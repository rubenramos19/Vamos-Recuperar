import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import IssueForm from "@/components/issues/IssueForm";
import { useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

const EditIssue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIssue } = useIssues();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      try {
        const fetchedIssue = await getIssue(id);
        
        if (!fetchedIssue) {
          toast({
            variant: "destructive",
            title: "Ocorrência não encontrada",
            description: "A ocorrência que estás a tentar editar não existe.",
          });
          navigate("/");
          return;
        }

        // Check if user has permission to edit
        if (!user || (!isAdmin() && user.id !== fetchedIssue.reporterId)) {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: "Não tens permissões para editar esta ocorrência.",
          });
          navigate("/");
          return;
        }

        setIssue(fetchedIssue);
      } catch (error) {
        logger.error("Error fetching issue:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a ocorrência.",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id, navigate, getIssue, user, isAdmin, toast]);

  const handleSubmitSuccess = () => {
    toast({
      title: "Ocorrência atualizada",
      description: "A tua ocorrência foi atualizada com sucesso.",
    });
    navigate(`/issue/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  const defaultValues = {
    title: issue.title,
    description: issue.description,
    category: issue.category,
    location: {
      latitude: issue.location.latitude,
      longitude: issue.location.longitude,
      address: issue.location.address,
    },
    photos: issue.photos || [],
    isPublic: issue.isPublic !== false,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Editar Ocorrência</h1>
        <p className="text-muted-foreground">
          Atualiza os detalhes da ocorrência que reportaste.
        </p>
      </div>
      <IssueForm
        issueId={id}
        defaultValues={defaultValues}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
};

export default EditIssue;
