import React from "react";
import { Card, CardContent } from "./Card";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "brand" | "red" | "green" | "purple" | "orange" | "teal" | "blue";
};

const variantMap: Record<NonNullable<EmptyStateProps["variant"]>, string> = {
  brand: "from-brand-500 to-brand-600",
  red: "from-red-500 to-pink-500",
  green: "from-green-500 to-blue-500",
  purple: "from-purple-500 to-blue-500",
  orange: "from-orange-500 to-red-500",
  teal: "from-teal-500 to-cyan-500",
  blue: "from-blue-500 to-indigo-500",
};

export function EmptyState({
  icon,
  title,
  message,
  actions,
  variant = "brand",
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        {icon && (
          <div
            className={`w-16 h-16 bg-gradient-to-br ${variantMap[variant]} rounded-2xl flex items-center justify-center mx-auto mb-6`}
          >
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        {message ? (
          <div className="text-gray-600 max-w-md mx-auto mb-8">{message}</div>
        ) : null}
        {actions}
      </CardContent>
    </Card>
  );
}

export default EmptyState;
