import React from "react";
import { Button } from "../components/ui/Button";
import { Network, Search, FileText } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";

export function SemanticSEO() {
  useDocumentTitle("Semantic SEO — AI Marketing");
  return (
    <PageContainer>
      <PageHeader
        title="Semantic SEO"
        description="Build articles from semantic clusters."
        icon={<Network className="h-5 w-5" />}
        actions={
          <Button>
            <Network className="h-4 w-4" />
            Build article
          </Button>
        }
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<Network className="h-8 w-8 text-white" />}
        title="Semantic Article Builder"
        message={
          <div className="space-y-10">
            <p className="text-base leading-relaxed">
              Generate deeply structured, SEO-optimized articles by mapping a
              semantic cluster of related entities, queries, and supporting
              concepts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Keyword Clustering
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Group & score related terms.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  SERP Intent Mapping
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Align structure to user goals.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Structured Outline
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Pillars, sections & entities.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Network className="h-4 w-4" />
                Build article
              </Button>
            </div>
          </div>
        }
        variant="brand"
      />
    </PageContainer>
  );
}
