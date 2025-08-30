import React from "react";
import { useCompanies } from "../../hooks/useCompanies";
import { cn } from "../../lib/utils";

interface CompanySelectProps {
  value?: string | number | null;
  onChange?: (companyId: string | number | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

/**
 * CompanySelect
 * Lightweight dropdown for picking a company context for generation tools.
 */
export function CompanySelect({
  value,
  onChange,
  placeholder = "Select a company...",
  className,
  label = "Company",
  required = false,
}: CompanySelectProps) {
  const { companies, loading, error } = useCompanies();

  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-base font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>
        <select
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60",
            error && "border-red-500",
          )}
          value={value ?? ""}
          disabled={loading || companies.length === 0}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange?.(e.target.value || null)}
        >
          <option value="" disabled>
            {loading
              ? "Loading companies..."
              : companies.length === 0
                ? "No companies found"
                : placeholder}
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.brand_name || c.name || "Unnamed"}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-base text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default CompanySelect;
