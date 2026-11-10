export function Input({ className = "", ...props }: React.ComponentProps<"input">) {
  return <input className={`h-10 w-full rounded-md border border-input bg-card px-3 text-sm ${className}`} {...props} />;
}
