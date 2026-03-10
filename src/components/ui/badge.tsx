import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-100 text-brand-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  destructive: "bg-red-100 text-red-700",
  outline: "border border-gray-300 text-gray-600",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
