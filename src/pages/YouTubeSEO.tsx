import React from "react";
import { Button } from "../components/ui/Button";
import { Youtube, ArrowRight, FileText } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function YouTubeSEO() {
  useDocumentTitle("YouTube → SEO Blog — AI Marketing");
  return (
    <div className="space-y-6">
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
        title="YouTube to SEO blog"
        message={
          <div>
            <p className="mb-8">
              This tool will extract YouTube transcripts and transform them into
              SEO-optimized blog posts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Youtube className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Extract Transcript
                </h4>
                <p className="text-base text-gray-600">
                  Automatically pull transcripts
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-6 w-6 text-brand-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  AI Processing
                </h4>
                <p className="text-base text-gray-600">SEO optimization</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  SEO Blog Post
                </h4>
                <p className="text-base text-gray-600">Ready to publish</p>
              </div>
            </div>
          </div>
        }
        variant="red"
      />
    </div>
  );
}
