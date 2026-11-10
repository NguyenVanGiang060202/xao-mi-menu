import { useEffect } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

export type AdminNotice = { message: string; kind: "success" | "error" };
export type NotifyAdmin = (message: string, kind: AdminNotice["kind"]) => void;

export function AdminToast({ notice, onDismiss }: { notice: AdminNotice | null; onDismiss: () => void }) {
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [notice, onDismiss]);

  const Icon = notice?.kind === "error" ? CircleAlert : CircleCheck;
  return <div className={notice
    ? "fixed inset-x-3 bottom-4 z-[70] flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-foreground shadow-lg sm:left-auto sm:right-5 sm:w-96"
    : "sr-only"}>
    {notice && <Icon size={21} aria-hidden="true" className={notice.kind === "error" ? "mt-0.5 shrink-0 text-red-700" : "mt-0.5 shrink-0 text-emerald-700"} />}
    <div className="min-w-0 flex-1 text-sm">
      <div role="status" aria-atomic="true">{notice?.kind === "success" ? notice.message : ""}</div>
      <div role="alert" aria-atomic="true">{notice?.kind === "error" ? notice.message : ""}</div>
    </div>
    {notice && <button type="button" aria-label="Đóng thông báo" onClick={onDismiss}
      className="-my-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg hover:bg-secondary focus-visible:outline-2">
      <X size={16} aria-hidden="true" />
    </button>}
  </div>;
}
