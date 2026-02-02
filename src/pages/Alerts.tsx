import React from "react";
import IpmaAlerts from "@/components/alerts/IpmaAlerts";
import { Link } from "react-router-dom";

const Alerts = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Alertas</h1>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            Voltar à página inicial
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <IpmaAlerts />
        </div>
      </div>
    </div>
  );
};

export default Alerts;
