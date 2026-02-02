import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Sobre o Vamos Recuperar</h1>
        <p className="text-lg text-muted-foreground">
          Uma plataforma criada para unir cidadãos e melhorar comunidades através da participação e ação conjunta.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>A Nossa Missão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O Vamos Recuperar nasce com o objetivo de aproximar os cidadãos das entidades responsáveis, 
              oferecendo uma forma simples e transparente de identificar problemas e acompanhar soluções.  
              Queremos fortalecer o envolvimento cívico e contribuir para comunidades mais cuidadas, seguras e eficientes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Reportar Ocorrências</h4>
                <p className="text-muted-foreground">
                  Qualquer cidadão pode reportar problemas na sua zona — desde estradas degradadas até iluminação partida — 
                  de forma rápida, com fotografia e localização exata.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Acompanhar o Progresso</h4>
                <p className="text-muted-foreground">
                  Segue o estado das ocorrências em tempo real, à medida que são analisadas, priorizadas 
                  e resolvidas pelas entidades competentes.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Construir Comunidades Melhores</h4>
                <p className="text-muted-foreground">
                  Juntos criamos uma ligação direta entre cidadãos e soluções, promovendo transparência, 
                  responsabilidade e melhoria contínua nos nossos espaços públicos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Mapa interativo para reportar problemas</li>
              <li>• Fotografias para melhor identificação das ocorrências</li>
              <li>• Acompanhamento do estado em tempo real</li>
              <li>• Organização por categorias</li>
              <li>• Transparência e participação comunitária</li>
              <li>• Design adaptado para telemóvel e uso em qualquer lugar</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Tens dúvidas, sugestões ou queres contribuir para o Vamos Recuperar? Fala connosco.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: suporte@vamosrecuperar.pt</p>
              <p>Telefone: (+351) 900 000 000</p>
              <p>Morada: Plataforma Nacional Vamos Recuperar, Portugal</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
