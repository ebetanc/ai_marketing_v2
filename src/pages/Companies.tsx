import React, { useCallback, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateBrandModal } from "../components/companies/CreateBrandModal";
import { ViewCompanyModal } from "../components/companies/ViewCompanyModal";
import { useCompanies } from "../hooks/useCompanies";
import { Plus, Building2, RefreshCw, Database, Search } from "lucide-react";
// removed truncateText usage after refactor
import { useToast } from "../components/ui/Toast";
import { Skeleton } from "../components/ui/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import CompanyListItem from "../components/companies/CompanyListItem";
import { ErrorState } from "../components/ui/ErrorState";

export function Companies() {
  useDocumentTitle("Companies — Lighting");
  const { companies: hookCompanies, loading, error, refetch } = useCompanies();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewCompanyModal, setViewCompanyModal] = useState<{
    isOpen: boolean;
    company: any | null;
  }>({
    isOpen: false,
    company: null,
  });
  const { push } = useToast();
  const companies = hookCompanies;
  const [search, setSearch] = useState("");

  const fetchCompaniesFromSupabase = useCallback(
    async (showToast = false) => {
      refetch();
      if (showToast) {
        push({
          title: "Refreshed",
          message: "Companies updated",
          variant: "success",
        });
      }
    },
    [refetch, push],
  );

  const handleCreateBrand = async () => {
    setShowCreateModal(false);
    // Refresh companies list after creation
    await fetchCompaniesFromSupabase();
  };

  const handleViewClick = (company: any) => {
    setViewCompanyModal({
      isOpen: true,
      company,
    });
  };

  const handleCloseViewModal = () => {
    setViewCompanyModal({
      isOpen: false,
      company: null,
    });
  };

  // const handleDeleteClick = (company: any) => {
  //   setDeleteDialog({
  //     isOpen: true,
  //     company,
  //     loading: false
  //   })
  // }

  // Deletion is handled inside ViewCompanyModal with its own ConfirmDialog

  // Group companies by brand name for better organization
  // const companiesByBrand = companies.reduce((acc, company) => {
  //   const brandName = company.brand_name || 'Unknown Brand'
  //   if (!acc[brandName]) {
  //     acc[brandName] = []
  //   }
  //   acc[brandName].push(company)
  //   return acc
  // }, {} as Record<string, any[]>)

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description="Manage brands and profiles."
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <>
            <Button
              onClick={() => fetchCompaniesFromSupabase(true)}
              loading={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add company
            </Button>
          </>
        }
      />

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBrand}
        refetchCompanies={fetchCompaniesFromSupabase}
      />

      {/* View Company Modal */}
      <ViewCompanyModal
        isOpen={viewCompanyModal.isOpen}
        onClose={handleCloseViewModal}
        company={viewCompanyModal.company}
        onDelete={fetchCompaniesFromSupabase}
      />

      {/* Delete Confirmation handled by ViewCompanyModal */}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorState
          icon={<Database className="h-12 w-12 text-red-500" />}
          title="Error loading companies"
          error={error}
          retry={
            <Button
              onClick={() => fetchCompaniesFromSupabase(true)}
              variant="outline"
              loading={loading}
              disabled={loading}
            >
              Try Again
            </Button>
          }
        />
      )}

      {/* Companies List */}
      {!loading && !error && companies.length > 0 && (
        <>
          <div className="relative mb-2 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies"
              aria-label="Search companies"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            />
          </div>
          <ul className="space-y-3">
            {companies
              .filter(
                (c) =>
                  !search ||
                  (c.brand_name || c.name || "")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((company) => (
                <CompanyListItem
                  key={company.id}
                  company={company}
                  onView={handleViewClick}
                />
              ))}
          </ul>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && companies.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-white" />}
          title="No companies"
          message="No companies yet."
          variant="brand"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add company
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}
