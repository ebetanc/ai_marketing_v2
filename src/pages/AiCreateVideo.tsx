import React from "react";
import { Video } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Placeholder page for AI Video creation. Replace with real implementation.
 */
export function CreateAiVideo() {
  useDocumentTitle("Create AI Video — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Create AI Video"
        description="Generate a marketing video with AI."
        icon={<Video className="h-5 w-5" />}
      />
      <div className="mt-6 text-sm text-gray-600 space-y-4">
        <p>
          This is a placeholder screen. The implementation hasn't been added
          yet.
        </p>
        <p className="text-gray-500">
          Add your form, media preview and generation workflow here.
        </p>
      </div>
    </PageContainer>
  );
}

export default CreateAiVideo;
