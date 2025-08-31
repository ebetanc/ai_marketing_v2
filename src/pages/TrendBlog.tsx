import React from "react";
import { Button } from "../components/ui/Button";
import { TrendingUp, Zap, Target, BarChart3 } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";

export function TrendBlog() {
  useDocumentTitle("Trend Blog — AI Marketing");
  return (
    <PageContainer>
      <PageHeader
        title="Trend blog"
        description="Generate blog posts from trends."
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <Button>
            <TrendingUp className="h-4 w-4" />
            Generate trend blog
          </Button>
        }
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<TrendingUp className="h-8 w-8 text-white" />}
        title="Trend Blog Generator"
        message={
          <div className="space-y-10">
            <p className="text-base leading-relaxed">
              Discover emerging topics and instantly spin up high-impact blog
              drafts aligned with what your audience is searching for today.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Trend Analysis
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Surface accelerating topics.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  AI Generation
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Draft compelling angles fast.
                </p>
              </div>
              <div className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition">
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-brand-700" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Viral Potential
                </h4>
                <p className="text-sm text-gray-600 leading-snug">
                  Optimize for shareability.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button className="bg-brand-600 hover:bg-brand-700">
                <TrendingUp className="h-4 w-4" />
                Generate trend blog
              </Button>
            </div>
          </div>
        }
        variant="brand"
      />
    </PageContainer>
  );
}
