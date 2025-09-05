import React from "react";
import { ImagePlus } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Placeholder page for AI Image creation. Replace with real implementation.
 */
export function CreateAIImage() {
  useDocumentTitle("Create AI Image — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Create AI Image"
        description="Generate product imagery with AI."
        icon={<ImagePlus className="h-5 w-5" />}
      />
      <div className="mt-6 text-sm text-gray-600 space-y-4">
        <p>
          This is a placeholder screen. The implementation hasn't been added
          yet.
        </p>
        <p className="text-gray-500">
          Add your prompt form, aspect ratio selector, and gallery here.
        </p>
      </div>
    </PageContainer>
  );
}

export default CreateAIImage;
