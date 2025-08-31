import React from "react";
import { Button } from "../components/ui/Button";
import { Youtube, ArrowRight, FileText } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";

export function YouTubeSEO() {
  useDocumentTitle("YouTube → SEO Blog — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="YouTube → SEO blog"
        description="Turn transcripts into SEO blog posts."
        icon={<Youtube className="h-5 w-5" />}
        actions={
          <Button>
            <Youtube className="h-4 w-4" />
            Start conversion
          </Button>
        }
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<Youtube className="h-8 w-8 text-white" />}
        title="YouTube → SEO Blog"
        message={
          <div className="space-y-10">
            <p className="text-base leading-relaxed">
              Transform long-form video knowledge into structured, SEO-ready
              articles—extract, clean, enrich, and publish.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Youtube className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Transcript Extraction
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Pull & normalize captions.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <ArrowRight className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Semantic Enrichment
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Add headings & entities.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Publishable Draft
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Optimized & structured output.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Youtube className="h-4 w-4" />
                Start conversion
              </Button>
            </div>
          </div>
        }
        variant="brand"
      />
    </PageContainer>
  );
}
