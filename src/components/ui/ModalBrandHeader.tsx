import React from "react";
import { ModalHeader, ModalTitle } from "./Modal";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";

interface ModalBrandHeaderProps {
  icon: React.ReactNode;
  title: string | React.ReactNode;
  onClose: () => void;
  titleId: string;
  leading?: React.ReactNode; // e.g. back button
  actionsRight?: React.ReactNode; // extra right-side actions before close
  className?: string;
}

export function ModalBrandHeader({
  icon,
  title,
  onClose,
  titleId,
  leading,
  actionsRight,
  className = "",
}: ModalBrandHeaderProps) {
  return (
    <ModalHeader
      className={`bg-gradient-to-r from-brand-600 to-brand-700 text-white ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {leading}
        <div className="w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <ModalTitle id={titleId} className="text-white truncate">
            {title}
          </ModalTitle>
        </div>
      </div>
      {actionsRight}
      <IconButton
        onClick={onClose}
        aria-label="Close dialog"
        variant="ghost"
        className="text-white hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </IconButton>
    </ModalHeader>
  );
}

export default ModalBrandHeader;
