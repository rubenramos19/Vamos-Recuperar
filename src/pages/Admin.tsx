import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminIssueTable from "@/components/admin/AdminIssueTable";
import AdminUserTable from "@/components/admin/AdminUserTable";
import { useIssues } from "@/contexts/IssueContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Users } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const { issues } = useIssues();
  const navigate = useNavigate();

  // Redirect if not an admin (wait for auth/role to finish loading)
  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin()) {
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>A carregar o painel de administração…</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin()) return null;

  const openIssues = issues.filter((issue) => issue.status === "open");
  const inProgressIssues = issues.filter((issue) => issue.status === "in_progress");
  const resolvedIssues = issues.filter((issue) => issue.status === "resolved");
  
  const stats = [
    { 
      title: "Por resolver", 
      value: openIssues.length, 
      description: "A aguardar análise e ação", 
      icon: <AlertCircle className="h-4 w-4 text-civic-red" />,
      iconBg: "bg-red-100",
    },
    { 
      title: "Em andamento", 
      value: inProgressIssues.length, 
      description: "A ser tratado no momento", 
      icon: <Loader2 className="h-4 w-4 text-civic-yellow animate-spin" />,
      iconBg: "bg-yellow-100",
    },
    { 
      title: "Resolvido", 
      value: resolvedIssues.length, 
      description: "Concluído com sucesso", 
      icon: <CheckCircle2 className="h-4 w-4 text-civic-green" />,
      iconBg: "bg-green-100",
    },
    { 
      title: "Total de ocorrências", 
      value: issues.length, 
      description: "Contagem geral", 
      icon: null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Painel de Administração</h1>
        <p className="text-muted-foreground mt-1">
          Gere e acompanha todas as ocorrências reportadas na plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon && (
                  <div className={`p-2 rounded-full ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                )}
              </div>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="issues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="issues">Gestão de Ocorrências</TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Gestão de Utilizadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Ocorrências</CardTitle>
              <CardDescription>
                Consulta, filtra e atualiza o estado de todas as ocorrências reportadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="open">Por resolver</TabsTrigger>
                  <TabsTrigger value="in_progress">Em andamento</TabsTrigger>
                  <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <AdminIssueTable />
                </TabsContent>
                <TabsContent value="open">
                  <AdminIssueTable statusFilter="open" />
                </TabsContent>
                <TabsContent value="in_progress">
                  <AdminIssueTable statusFilter="in_progress" />
                </TabsContent>
                <TabsContent value="resolved">
                  <AdminIssueTable statusFilter="resolved" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Utilizadores</CardTitle>
              <CardDescription>
                Consulta todos os utilizadores e gere os seus perfis e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
