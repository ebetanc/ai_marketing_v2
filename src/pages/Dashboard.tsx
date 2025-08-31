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
import { formatDate, formatTime, relativeTime, cn } from "../lib/utils";
import type { CompanyUI } from "../hooks/useCompanies";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ListSkeleton } from "../components/ui/ListSkeleton";

export function Dashboard() {
  useDocumentTitle("Dashboard — Lighting");
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
      id: "companies",
      title: "Active Companies",
      value: companies.length,
      change: pct(companiesCurrent.length, companiesPrev.length),
      icon: Users,
      accent: "from-brand-500/10 to-brand-500/0 text-brand-600",
      iconBg: "bg-brand-50",
    },
    {
      id: "content",
      title: "Content Pieces",
      value: contentPieces.length,
      change: pct(contentCurrent.length, contentPrev.length),
      icon: FileText,
      accent: "from-brand-500/10 to-brand-500/0 text-brand-600",
      iconBg: "bg-brand-50",
    },
    {
      id: "generated",
      title: "Generated Content",
      value: contentPieces.length,
      change: pct(contentCurrent.length, contentPrev.length),
      icon: Target,
      accent: "from-brand-500/10 to-brand-500/0 text-brand-600",
      iconBg: "bg-brand-50",
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
    <PageContainer>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            className="relative overflow-hidden group focus-within:ring-2 focus-within:ring-brand-500"
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                stat.accent,
              )}
            />
            <CardContent className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 tabular-nums">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                      {stat.change}
                    </span>
                    <span className="text-gray-500">vs last 7d</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-xl flex items-center justify-center ring-1 ring-inset ring-gray-200",
                    stat.iconBg,
                  )}
                >
                  <stat.icon
                    className={cn("h-6 w-6", stat.accent?.split(" ").at(-1))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{recentActivity.length} items</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
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
              <div className="space-y-2 divide-y divide-gray-100 -mx-4 sm:mx-0">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {activity.type === "content_generated" && (
                        <div className="w-9 h-9 bg-brand-600/10 ring-1 ring-brand-600/20 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-brand-700" />
                        </div>
                      )}
                      {activity.type === "company_added" && (
                        <div className="w-9 h-9 bg-brand-600/10 ring-1 ring-brand-600/20 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-brand-700" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.description || "No description"}
                      </p>
                      <div className="flex items-center mt-2 gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(activity.time)}</span>
                        <span aria-hidden>•</span>
                        <span>{relativeTime(activity.time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Companies */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active companies</CardTitle>
              <Badge variant="primary" className="font-medium">
                {companies.length} companies
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
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
              <div className="-mx-4 sm:mx-0 divide-y divide-gray-100">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 gap-4 hover:bg-gray-50 group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-semibold text-base shadow-sm">
                          {(company.brand_name || company.name || "U").charAt(
                            0,
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {company.brand_name || company.name || "Unnamed Brand"}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {(company.brand_voice?.tone || "").length > 70
                          ? `${(company.brand_voice?.tone || "").substring(0, 70)}...`
                          : company.brand_voice?.tone || "Not specified"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {
                            contentPieces.filter(
                              (c) => c.company_id === String(company.id),
                            ).length
                          }{" "}
                          pieces
                        </p>
                        <p className="text-xs text-gray-500">
                          Added {relativeTime(company.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCompany(company)}
                        className="transition-opacity"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          View
                        </span>
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
            <QuickAction
              icon={FileText}
              title="Generate content"
              description="Create posts, blogs, and more."
              onClick={() => navigate("/content")}
            />
            <QuickAction
              icon={Target}
              title="New campaign"
              description="Plan a multi-channel campaign."
              onClick={() => navigate("/campaigns")}
            />
            <QuickAction
              icon={Users}
              title="Add company"
              description="Onboard a client."
              onClick={() => navigate("/companies")}
            />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

interface QuickActionProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color?: "brand" | "teal" | "orange";
  onClick: () => void;
}

function QuickAction({
  icon: Icon,
  title,
  description,
  color = "brand",
  onClick,
}: QuickActionProps) {
  const colorMap: Record<
    string,
    {
      border: string;
      hoverBorder: string;
      hoverBg: string;
      icon: string;
      title: string;
    }
  > = {
    brand: {
      border: "border-gray-200",
      hoverBorder: "hover:border-brand-300",
      hoverBg: "hover:bg-brand-50",
      icon: "text-gray-400 group-hover:text-brand-600",
      title: "group-hover:text-brand-900",
    },
    teal: {
      border: "border-gray-200",
      hoverBorder: "hover:border-teal-300",
      hoverBg: "hover:bg-teal-50",
      icon: "text-gray-400 group-hover:text-teal-600",
      title: "group-hover:text-teal-900",
    },
    orange: {
      border: "border-gray-200",
      hoverBorder: "hover:border-orange-300",
      hoverBg: "hover:bg-orange-50",
      icon: "text-gray-400 group-hover:text-orange-600",
      title: "group-hover:text-orange-900",
    },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 border-2 border-dashed rounded-xl transition-all duration-200 group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        c.border,
        c.hoverBorder,
        c.hoverBg,
      )}
    >
      <Icon className={cn("h-8 w-8 mx-auto mb-3", c.icon)} />
      <h3 className={cn("font-medium text-gray-900", c.title)}>{title}</h3>
      <p className="text-sm text-gray-500 mt-1 hidden sm:block">
        {description}
      </p>
    </button>
  );
}
