import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informação que Recolhemos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Informação Pessoal</h4>
              <p className="text-muted-foreground">
                Recolhemos a informação que forneces ao criar uma conta, incluindo o teu nome,
                email e qualquer informação opcional de perfil que escolhas partilhar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Ocorrências Reportadas</h4>
              <p className="text-muted-foreground">
                Quando reportas ocorrências, recolhemos a descrição, categoria, dados de localização
                e quaisquer fotografias que anexes. Esta informação é utilizada para facilitar o
                encaminhamento e a resolução pelas entidades responsáveis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Informação de Utilização</h4>
              <p className="text-muted-foreground">
                Recolhemos automaticamente alguma informação sobre a utilização da plataforma,
                como endereço IP, tipo de navegador e padrões de uso, para melhorar a experiência
                e a qualidade do serviço.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Usamos a Tua Informação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Processar e gerir ocorrências reportadas</li>
              <li>• Comunicar contigo sobre o estado das ocorrências</li>
              <li>• Melhorar funcionalidades e experiência de utilização</li>
              <li>• Garantir a segurança da plataforma e prevenir abusos</li>
              <li>• Cumprir obrigações legais</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partilha de Informação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Partilhamos a tua informação apenas nas seguintes situações:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Com entidades competentes quando submetes ocorrências públicas</li>
              <li>• Quando exigido por lei ou por processo legal</li>
              <li>• Para proteger os direitos e a segurança dos utilizadores e do público</li>
              <li>• Com prestadores de serviços que apoiam a operação da plataforma (sob acordos de confidencialidade)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Implementamos medidas técnicas e organizacionais adequadas para proteger a tua informação
              contra acesso não autorizado, alteração, divulgação ou destruição. Ainda assim, nenhuma
              transmissão pela internet é 100% segura.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Os Teus Direitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Aceder e consultar os teus dados pessoais</li>
              <li>• Corrigir dados incorretos ou incompletos</li>
              <li>• Eliminar a tua conta e os dados associados</li>
              <li>• Opor-te a determinados tratamentos de dados</li>
              <li>• Solicitar portabilidade dos dados</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Para exercer estes direitos, contacta-nos em privacidade@vamosrecuperar.pt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterações a Esta Política</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade ocasionalmente. Quando existirem alterações
              relevantes, iremos publicá-las nesta página e atualizar a data de “Última atualização”.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
