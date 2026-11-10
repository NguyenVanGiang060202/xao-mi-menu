"use client";
export function Switch({ checked, onCheckedChange, ...props }: {
  checked: boolean; onCheckedChange: (value: boolean) => void; "aria-label": string; disabled?: boolean;
}) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)}
    className={`inline-flex h-7 w-12 items-center rounded-full p-1 disabled:opacity-50 ${checked ? "justify-end bg-primary" : "justify-start bg-muted-foreground"}`} {...props}>
    <span className="size-5 rounded-full bg-white" />
  </button>;
}
