import React from "react";
import { Wand2 } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Placeholder page for AI Image editing. Replace with real implementation.
 */
export function EditImageWithAI() {
  useDocumentTitle("Edit Image with AI — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Edit Image with AI"
        description="Apply AI transformations to an existing image."
        icon={<Wand2 className="h-5 w-5" />}
      />
      <div className="mt-6 text-sm text-gray-600 space-y-4">
        <p>
          This is a placeholder screen. The implementation hasn't been added
          yet.
        </p>
        <p className="text-gray-500">
          Add your image upload, mask tools, and variation gallery here.
        </p>
      </div>
    </PageContainer>
  );
}

export default EditImageWithAI;
