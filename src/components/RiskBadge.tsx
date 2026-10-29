import React from "react";
import { RiskLevel } from "@/lib/types";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = "md" }) => {
  const configs = {
    LOW: {
      label: "Low Risk",
      style: "bg-mint-50 text-mint-800 border-mint-200",
      icon: ShieldCheck,
      iconColor: "text-mint-700",
    },
    MEDIUM: {
      label: "Medium Caution",
      style: "bg-amber-50 text-amber-800 border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-700",
    },
    HIGH: {
      label: "High Risk Warning",
      style: "bg-coral-50 text-coral-800 border-coral-200",
      icon: ShieldAlert,
      iconColor: "text-coral-700",
    },
  };

  const current = configs[level] || configs.MEDIUM;
  const Icon = current.icon;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
    md: "px-3 py-1 text-sm gap-2 font-medium",
    lg: "px-3.5 py-1.5 text-sm sm:text-base gap-2 font-semibold",
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${current.style} ${sizeClasses[size]}`}
    >
      <Icon
        size={iconSizes[size]}
        className={current.iconColor}
        aria-hidden="true"
      />
      <span>{current.label}</span>
    </span>
  );
};
