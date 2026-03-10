import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "default"
  | "outline"
  | "ghost"
  | "destructive"
  | "secondary";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500",
  outline:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-gray-400",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
  secondary:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
