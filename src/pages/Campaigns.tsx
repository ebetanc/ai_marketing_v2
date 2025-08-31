import React from "react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Megaphone, Plus, Calendar, Target, Users } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";

export function Campaigns() {
  useDocumentTitle("Campaigns — AI Marketing");
  return (
    <PageContainer>
      <PageHeader
        title="Campaigns"
        description="Plan and manage campaigns."
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        }
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<Megaphone className="h-8 w-8 text-white" />}
        title="Campaign Builder"
        message={
          <div className="space-y-10">
            <p className="text-base leading-relaxed">
              Plan, orchestrate, and measure multi‑channel campaigns with
              scheduling intelligence and collaborative workflow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Smart Scheduling
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Predict peak engagement windows.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Multi‑Channel
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Coordinate social, email & ads.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Collaboration
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Share drafts & track approvals.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Megaphone className="h-4 w-4" />
                Plan campaign
              </Button>
              <Badge variant="primary" className="text-xs px-2 py-1">
                Phase 2
              </Badge>
            </div>
          </div>
        }
        variant="brand"
      />
    </PageContainer>
  );
}
