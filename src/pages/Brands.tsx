import React, { useCallback, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CreateBrandModal } from "../components/companies/CreateBrandModal";
import { ViewBrandModal } from "../components/brands/ViewBrandModal";
import { useCompanies } from "../hooks/useCompanies";
import { Plus, Building2, RefreshCw, Database, Search, X } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { Skeleton } from "../components/ui/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import BrandListItem from "../components/brands/BrandListItem";
import { ErrorState } from "../components/ui/ErrorState";

export function Brands() {
  useDocumentTitle("Brands — AI Marketing");
  const { companies: brands, loading, error, refetch } = useCompanies();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    brand: any | null;
  }>({ isOpen: false, brand: null });
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const fetchBrands = useCallback(
    async (showToast = false) => {
      refetch();
      if (showToast) {
        push({
          title: "Refreshed",
          message: "Brands updated",
          variant: "success",
        });
      }
    },
    [refetch, push],
  );
  const handleCreateBrand = async () => {
    setShowCreateModal(false);
    await fetchBrands();
  };
  const filtered = brands.filter(
    (b) =>
      !search ||
      (b.brand_name || b.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Brands"
        description="Manage brands and profiles."
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => fetchBrands(true)}
              loading={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add brand
            </Button>
          </div>
        }
      />
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBrand}
        refetchCompanies={fetchBrands}
      />
      <ViewBrandModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, brand: null })}
        brand={viewModal.brand}
        onDelete={fetchBrands}
      />
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {error && (
        <ErrorState
          icon={<Database className="h-12 w-12 text-red-500" />}
          title="Error loading brands"
          error={error}
          retry={
            <Button
              onClick={() => fetchBrands(true)}
              variant="outline"
              loading={loading}
              disabled={loading}
            >
              Try Again
            </Button>
          }
        />
      )}
      {!loading && !error && brands.length > 0 && (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands"
              aria-label="Search brands"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-base bg-white shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-8 w-8 text-white" />}
              title="No matches"
              message={`No brands match "${search}"`}
              variant="brand"
              actions={
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((brand) => (
                <BrandListItem
                  key={brand.id}
                  brand={brand}
                  onView={(b) => setViewModal({ isOpen: true, brand: b })}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {!loading && !error && brands.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-white" />}
          title="No brands"
          message="No brands yet."
          variant="brand"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add brand
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}

export default Brands;
