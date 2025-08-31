import React from "react";
import { Button } from "../components/ui/Button";
import { Search, Target, Lightbulb } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";

export function KeywordResearch() {
  useDocumentTitle("Keyword Research — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Keyword research"
        description="Turn a keyword into 5 distinct blog ideas."
        icon={<Search className="h-5 w-5" />}
        actions={
          <Button>
            <Search className="h-4 w-4" />
            Start research
          </Button>
        }
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<Search className="h-8 w-8 text-white" />}
        title="Keyword Research"
        message={
          <div className="space-y-10">
            <p className="text-base leading-relaxed">
              Enter a seed keyword and instantly generate a semantic map plus 5
              high-quality, intent-aligned blog ideas you can turn into
              optimized articles.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Keyword Analysis
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Understand search intent & context.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Semantic Mapping
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Cluster related entities & topics.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">5 Blog Ideas</h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Distinct, research-backed angles.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Search className="h-4 w-4" />
                Start research
              </Button>
            </div>
          </div>
        }
        variant="brand"
      />
    </PageContainer>
  );
}
