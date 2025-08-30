import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ViewCompanyModal } from "../components/companies/ViewCompanyModal";
import { TrendingUp, FileText, Users, Target, Clock, Eye } from "lucide-react";
import { useCompanies } from "../hooks/useCompanies";
import { useContentPieces } from "../hooks/useContentPieces";
import { formatDate, formatTime } from "../lib/utils";
import type { CompanyUI } from "../hooks/useCompanies";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ListSkeleton } from "../components/ui/ListSkeleton";

export function Dashboard() {
  useDocumentTitle("Dashboard — AI Marketing");
  const navigate = useNavigate();
  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
    refetch: refetchCompanies,
  } = useCompanies();
  const {
    contentPieces,
    loading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useContentPieces();
  const [viewCompanyModal, setViewCompanyModal] = React.useState<{
    isOpen: boolean;
    company: CompanyUI | null;
  }>({
    isOpen: false,
    company: null,
  });

  const handleViewCompany = (company: CompanyUI) => {
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

  // Compute simple deltas: last 7 days vs previous 7 days
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const currentWindowStart = now - sevenDays;
  const prevWindowStart = now - 2 * sevenDays;

  const companiesCurrent = companies.filter(
    (c) => new Date(c.created_at).getTime() >= currentWindowStart,
  );
  const companiesPrev = companies.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= prevWindowStart && t < currentWindowStart;
  });

  const contentCurrent = contentPieces.filter(
    (c) => new Date(c.created_at).getTime() >= currentWindowStart,
  );
  const contentPrev = contentPieces.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= prevWindowStart && t < currentWindowStart;
  });

  // Approval metrics removed

  const pct = (curr: number, prev: number) => {
    if (prev <= 0) return "+0%";
    const delta = ((curr - prev) / prev) * 100;
    const sign = delta > 0 ? "+" : "";
    return `${sign}${Math.round(delta)}%`;
  };

  const stats = [
    {
      title: "Active Companies",
      value: companies.length,
      change: pct(companiesCurrent.length, companiesPrev.length),
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Content Pieces",
      value: contentPieces.length,
      change: pct(contentCurrent.length, contentPrev.length),
      changeType: "positive" as const,
      icon: FileText,
    },
    {
      title: "Generated Content",
      value: contentPieces.length,
      change: pct(contentCurrent.length, contentPrev.length),
      changeType: "positive" as const,
      icon: Target,
    },
  ];

  const recentActivity = React.useMemo(() => {
    // Derive recent activity from latest content pieces
    const items = contentPieces.slice(0, 6).map((c) => ({
      id: c.id,
      type: "content_generated",
      title: `${c.platform ?? "Content"}: ${c.title || "Untitled"}`,
      description: (c.body || "").slice(0, 100),
      time: c.created_at,
    }));
    return items;
  }, [contentPieces]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your marketing at a glance."
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => refetchContent()}
              disabled={contentLoading}
            >
              Refresh
            </Button>
            <Button onClick={() => navigate("/content")}>
              <FileText className="h-4 w-4 mr-2" />
              Generate content
            </Button>
          </>
        }
      />

      {/* View Company Modal */}
      <ViewCompanyModal
        isOpen={viewCompanyModal.isOpen}
        onClose={handleCloseViewModal}
        company={viewCompanyModal.company}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-base text-green-600">
                      {stat.change}
                    </span>
                    <span className="text-base text-gray-500 ml-1 hidden sm:inline">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-brand-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{recentActivity.length} items</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {contentLoading ? (
              <ListSkeleton
                rows={4}
                avatar="circle"
                primaryWidthClass="w-2/3"
                secondaryWidthClass="w-5/6"
              />
            ) : contentError ? (
              <ErrorState
                title="Could not load recent activity"
                error={contentError}
                retry={
                  <Button variant="outline" onClick={() => refetchContent()}>
                    Retry
                  </Button>
                }
                icon={<FileText className="h-6 w-6 text-red-500" />}
              />
            ) : recentActivity.length === 0 ? (
              <EmptyState
                title="No recent activity"
                message="Generate content to see your latest activity here."
                icon={<FileText className="h-8 w-8 text-white" />}
                actions={
                  <Button onClick={() => navigate("/content")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate content
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {activity.type === "content_generated" && (
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-brand-600" />
                        </div>
                      )}
                      {activity.type === "company_added" && (
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-teal-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-base text-gray-500">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-base text-gray-500">
                          {formatTime(activity.time)}
                        </span>
                        {/* Status badge removed */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Companies */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active companies</CardTitle>
              <Badge variant="primary">{companies.length} companies</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <ListSkeleton
                rows={4}
                avatar="square"
                primaryWidthClass="w-40"
                secondaryWidthClass="w-64"
                showTrailingButton
              />
            ) : companiesError ? (
              <ErrorState
                title="Could not load companies"
                error={companiesError}
                retry={
                  <Button variant="outline" onClick={() => refetchCompanies()}>
                    Retry
                  </Button>
                }
                icon={<Users className="h-6 w-6 text-red-500" />}
              />
            ) : companies.length === 0 ? (
              <EmptyState
                title="No companies"
                message="Add a company to get started."
                icon={<Users className="h-8 w-8 text-white" />}
                actions={
                  <Button onClick={() => navigate("/companies")}>
                    <Users className="h-4 w-4 mr-2" />
                    Add company
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold text-base">
                          {(company.brand_name || company.name || "U").charAt(
                            0,
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {company.brand_name ||
                            company.name ||
                            "Unnamed Brand"}
                        </p>
                        <p className="text-base text-gray-500">
                          {(company.brand_voice?.tone || "").length > 50
                            ? `${(company.brand_voice?.tone || "").substring(0, 50)}...`
                            : company.brand_voice?.tone || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-base font-medium text-gray-900">
                          {
                            contentPieces.filter(
                              (c) => c.company_id === String(company.id),
                            ).length
                          }{" "}
                          pieces
                        </p>
                        <p className="text-base text-gray-500">
                          Created {formatDate(company.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCompany(company)}
                        className="transition-opacity"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/content")}
              className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all duration-200 group"
            >
              <FileText className="h-8 w-8 text-gray-400 group-hover:text-brand-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 group-hover:text-brand-900">
                Generate content
              </h3>
              <p className="text-base text-gray-500 mt-1 hidden sm:block">
                Create posts, blogs, and more.
              </p>
            </button>

            <button
              onClick={() => navigate("/campaigns")}
              className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 group"
            >
              <Target className="h-8 w-8 text-gray-400 group-hover:text-teal-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 group-hover:text-teal-900">
                New campaign
              </h3>
              <p className="text-base text-gray-500 mt-1 hidden sm:block">
                Plan a multi‑channel campaign.
              </p>
            </button>

            <button
              onClick={() => navigate("/companies")}
              className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
            >
              <Users className="h-8 w-8 text-gray-400 group-hover:text-orange-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 group-hover:text-orange-900">
                Add company
              </h3>
              <p className="text-base text-gray-500 mt-1 hidden sm:block">
                Onboard a client.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
