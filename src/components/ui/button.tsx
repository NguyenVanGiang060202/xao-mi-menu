import { Slot } from "@radix-ui/react-slot";

export function Button({ asChild, variant, size, className = "", ...props }: React.ComponentProps<"button"> & {
  asChild?: boolean; variant?: "outline" | "secondary" | "ghost"; size?: "icon";
}) {
  const Component = asChild ? Slot : "button";
  const color = variant === "outline" ? "border border-border bg-card hover:bg-secondary" :
    variant === "secondary" ? "bg-secondary hover:bg-secondary/80" :
    variant === "ghost" ? "hover:bg-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90";
  return <Component type={asChild ? undefined : "button"} className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${size === "icon" ? "size-9" : "px-3 py-2"} ${color} ${className}`} {...props} />;
}
