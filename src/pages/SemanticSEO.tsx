import React from "react";
import { Button } from "../components/ui/Button";
import { Network, Search, FileText } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function SemanticSEO() {
  useDocumentTitle("Semantic SEO — AI Marketing");
  return (
    <div className="space-y-6">
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
        title="Semantic article builder"
        message={
          <div>
            <p className="mb-8">
              Generate SEO-optimized articles by clustering related keywords and
              topics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Network className="h-6 w-6 text-brand-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Keyword Clustering
                </h4>
                <p className="text-base text-gray-600">
                  Group related keywords
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  SEO Optimization
                </h4>
                <p className="text-base text-gray-600">Optimize for intent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Comprehensive Article
                </h4>
                <p className="text-base text-gray-600">
                  Well-structured results
                </p>
              </div>
            </div>
          </div>
        }
        variant="blue"
      />
    </div>
  );
}
