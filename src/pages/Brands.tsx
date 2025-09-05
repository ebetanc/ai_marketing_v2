import React from "react";
import { LayoutDashboard } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Brands() {
  useDocumentTitle("Brands — Lighting");
  return (
    <PageContainer>
      <PageHeader
        title="Brands"
        description="Manage brands (placeholder)."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />
      <div className="mt-6 text-sm text-gray-600 space-y-4">
        <p>This page is a placeholder. Implement brand list and CRUD here.</p>
      </div>
    </PageContainer>
  );
}

export default Brands;
