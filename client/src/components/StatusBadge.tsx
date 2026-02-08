import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  variant?: "outline" | "solid";
}

export function StatusBadge({ status, className, variant = "solid" }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace("_", " ");
  
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
  
  if (["completed", "approved", "present", "high"].includes(status)) {
    colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (["in_progress", "medium"].includes(status)) {
    colorClass = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (["pending", "sick", "casual", "vacation"].includes(status)) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (["rejected", "absent", "critical"].includes(status)) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
  } else if (["low"].includes(status)) {
    colorClass = "bg-slate-100 text-slate-800 border-slate-200";
  }

  if (variant === "outline") {
    // Convert background to transparent and keep text/border
    // This is a simplification; for a robust system we might need more explicit mapping
    if (colorClass.includes("emerald")) colorClass = "bg-transparent text-emerald-600 border-emerald-600 border";
    else if (colorClass.includes("blue")) colorClass = "bg-transparent text-blue-600 border-blue-600 border";
    else if (colorClass.includes("amber")) colorClass = "bg-transparent text-amber-600 border-amber-600 border";
    else if (colorClass.includes("red")) colorClass = "bg-transparent text-red-600 border-red-600 border";
    else colorClass = "bg-transparent text-slate-600 border-slate-600 border";
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border",
      colorClass,
      className
    )}>
      {normalizedStatus}
    </span>
  );
}
