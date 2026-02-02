import React, { useCallback, useMemo, useState } from "react";
import IssueMap from "@/components/maps/IssueMap";
import { useIssues } from "@/contexts/IssueContext";
import IssueDetail from "@/components/issues/IssueDetail";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, X } from "lucide-react";

const Map = () => {
  const { user } = useAuth();
  const { issues } = useIssues();

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue = useMemo(() => {
    if (!selectedIssueId) return undefined;
    return issues.find((issue) => issue.id === selectedIssueId);
  }, [issues, selectedIssueId]);

  const handleIssueSelect = useCallback((issueId: string) => {
    setSelectedIssueId(issueId);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="relative flex-grow">
        <IssueMap onIssueSelect={handleIssueSelect} />
        {selectedIssue && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedIssueId(null)} />

            <div className="relative w-[min(980px,96%)] max-h-[90vh] overflow-auto rounded-2xl bg-white text-slate-900 p-6 shadow-2xl border">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold text-slate-900">Detalhes da ocorrência</h2>
                <Button variant="ghost" onClick={() => setSelectedIssueId(null)} className="text-slate-600">
                  <X />
                </Button>
              </div>

              <div className="mt-2">
                <IssueDetail issue={selectedIssue} />
              </div>
            </div>
          </div>
        )}

        {/* Report só com login */}
        {user && (
          <div className="fixed right-4 bottom-4 md:hidden">
            <Link to="/report">
              <Button size="lg" className="h-14 w-14 rounded-full">
                <Plus className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
