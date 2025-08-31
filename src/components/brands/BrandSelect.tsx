import React from "react";
import { useCompanies } from "../../hooks/useCompanies"; // underlying data table remains companies
import { cn } from "../../lib/utils";

interface BrandSelectProps {
  value?: string | number | null;
  onChange?: (brandId: string | number | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export function BrandSelect({
  value,
  onChange,
  placeholder = "Select a brand...",
  className,
  label = "Brand",
  required = false,
}: BrandSelectProps) {
  const { companies: brands, loading, error } = useCompanies();

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
          disabled={loading || brands.length === 0}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange?.(e.target.value || null)}
        >
          <option value="" disabled>
            {loading
              ? "Loading brands..."
              : brands.length === 0
                ? "No brands found"
                : placeholder}
          </option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brand_name || b.name || "Unnamed"}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-base text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default BrandSelect;
