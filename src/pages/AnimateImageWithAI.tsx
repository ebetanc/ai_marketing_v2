import React from "react";
import { PlayCircle } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Placeholder page for AI Image animation. Replace with real implementation.
 */
export function AnimateImageWithAI() {
  useDocumentTitle("Animate Image with AI — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Animate Image with AI"
        description="Animate an image using AI motion models."
        icon={<PlayCircle className="h-5 w-5" />}
      />
      <div className="mt-6 text-sm text-gray-600 space-y-4">
        <p>
          This is a placeholder screen. The implementation hasn't been added
          yet.
        </p>
        <p className="text-gray-500">
          Add your animation controls, preview canvas, and export options here.
        </p>
      </div>
    </PageContainer>
  );
}

export default AnimateImageWithAI;
