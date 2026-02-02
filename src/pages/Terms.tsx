import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Termos de Serviço</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aceitação dos Termos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ao aceder e utilizar o Vamos Recuperar, concordas em cumprir estes Termos de Serviço.
              Se não concordares com estas condições, pedimos que não utilizes a plataforma.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivo da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O Vamos Recuperar foi criado para facilitar a comunicação entre cidadãos e entidades locais
              relativamente a problemas da comunidade. A plataforma serve como ferramenta para reportar,
              acompanhar e resolver ocorrências de forma transparente e colaborativa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsabilidades do Utilizador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Reportar com Precisão</h4>
                <p className="text-muted-foreground">
                  Os utilizadores devem fornecer informação verdadeira e correta ao submeter ocorrências.
                  Reportes falsos ou enganosos podem levar à suspensão da conta.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Conteúdo Apropriado</h4>
                <p className="text-muted-foreground">
                  Todo o conteúdo publicado deve ser adequado para visualização pública. Não é permitido
                  publicar material ofensivo, discriminatório ou impróprio.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Respeito pela Privacidade</h4>
                <p className="text-muted-foreground">
                  Ao partilhar fotografias ou localização, o utilizador deve respeitar a privacidade de terceiros
                  e evitar captar propriedade privada sem consentimento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilizações Proibidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Não é permitido utilizar o Vamos Recuperar para:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Submeter ocorrências falsas ou fraudulentas</li>
              <li>• Assediar ou ameaçar indivíduos ou grupos</li>
              <li>• Publicar conteúdo que viole leis ou regulamentos locais</li>
              <li>• Sobrecarregar o sistema com spam ou reportes duplicados</li>
              <li>• Utilizar a plataforma para fins comerciais ou publicidade</li>
              <li>• Violar direitos ou privacidade de outras pessoas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderação de Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O Vamos Recuperar reserva o direito de rever, moderar ou remover qualquer conteúdo que viole estes termos
              ou seja considerado inadequado. Contas que infrinjam repetidamente as regras poderão ser suspensas ou encerradas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitação de Responsabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O Vamos Recuperar funciona como uma ponte de comunicação entre cidadãos e entidades responsáveis.
              Não garantimos a resolução de todas as ocorrências e não somos responsáveis pelas ações ou omissões
              das autoridades perante os reportes submetidos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Propriedade Intelectual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Os utilizadores mantêm a propriedade do conteúdo que submetem, mas concedem ao Vamos Recuperar
              licença para utilizar, exibir e partilhar esse conteúdo com o objetivo de facilitar a resolução
              das ocorrências e o funcionamento da plataforma.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterações aos Termos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de alterar estes termos a qualquer momento. Os utilizadores serão notificados
              de mudanças significativas e a continuação do uso da plataforma implica aceitação dos termos atualizados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Para questões relacionadas com estes Termos de Serviço, contacta-nos através de 
              legal@vamosrecuperar.pt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
