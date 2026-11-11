"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Link2, Save, Unplug } from "lucide-react";
import { connectGrabFood, disconnectGrabFood, getGrabConnectionStatus } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { NotifyAdmin } from "@/components/admin-toast";
import { channels } from "@/lib/catalog";
import type { GrabConnectionStatus } from "@/lib/grab-connection";

export function GrabConnection({ disabled, reconnectRequired, notify, onChange }: {
  disabled: boolean;
  reconnectRequired: boolean;
  notify: NotifyAdmin;
  onChange: () => void;
}) {
  const [status, setStatus] = useState<GrabConnectionStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [curl, setCurl] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const busy = disabled || saving;

  useEffect(() => {
    let current = true;
    void getGrabConnectionStatus().then(
      value => { if (current) setStatus(value); },
      () => { if (current) setStatusError(true); },
    );
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (reconnectRequired) setOpen(true);
  }, [reconnectRequired]);

  async function connect() {
    if (busy || !curl.trim()) return;
    setSaving(true);
    try {
      const result = await connectGrabFood(curl);
      notify(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setStatus(result.connection);
        setStatusError(false);
        setOpen(false);
        onChange();
      }
    } catch {
      notify("Không lưu được kết nối GrabFood. Hãy thử lại.", "error");
    } finally {
      setCurl("");
      setSaving(false);
    }
  }

  async function disconnect() {
    if (busy) return;
    setSaving(true);
    try {
      const result = await disconnectGrabFood();
      setStatus({ connected: false, connectedAt: null });
      setCurl("");
      setOpen(false);
      onChange();
      notify(result.message, "success");
    } catch {
      notify("Không ngắt được kết nối. Hãy thử lại.", "error");
    } finally {
      setSaving(false);
    }
  }

  return <section className="mb-4 rounded-xl border border-border bg-card p-3 sm:p-4" aria-labelledby="grab-connection-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 id="grab-connection-title" className="flex items-center gap-2 text-sm font-bold"><Link2 size={16} aria-hidden="true" />Kết nối GrabFood</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {statusError ? "Chưa kiểm tra được kết nối. Bạn có thể kết nối lại bên dưới."
            : reconnectRequired ? "Phiên cần được cập nhật trước khi tiếp tục đồng bộ."
            : status?.connected ? "Đã lưu phiên. Mỗi lần đồng bộ sẽ lấy lại token tài khoản từ GrabFood."
            : status ? "Chưa lưu phiên. Kết nối để lấy tên, mô tả và giá tiếng Việt gốc."
            : "Đang kiểm tra kết nối…"}
        </p>
        {status?.connectedAt && <p className="mt-1 text-xs text-muted-foreground">
          Cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(status.connectedAt))}
        </p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} aria-expanded={open} aria-controls="grab-connection-form"
          onClick={() => setOpen(value => !value)}>{status?.connected ? "Cập nhật phiên" : "Kết nối GrabFood"}</Button>
        {status?.connected && <Button variant="ghost" disabled={busy} onClick={() => void disconnect()}><Unplug size={14} aria-hidden="true" />Ngắt kết nối</Button>}
      </div>
    </div>
    {open && <form id="grab-connection-form" className="mt-4 space-y-3 border-t border-border pt-3"
      onSubmit={event => { event.preventDefault(); void connect(); }}>
      <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
        <li>Đăng nhập GrabFood bằng Google trên trình duyệt và chọn Tiếng Việt.</li>
        <li>Mở DevTools → Network, tải lại trang quán và chọn request <code>v2/order/merchants/5-C8KGJLKAN3UEEE</code>.</li>
        <li>Chọn Copy as cURL, dán bên dưới rồi bấm Kết nối và lưu.</li>
      </ol>
      <a href={channels.grab.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
        Mở GrabFood <ArrowUpRight size={12} aria-hidden="true" />
      </a>
      <label className="block text-xs font-semibold" htmlFor="grab-session-curl">cURL của request menu</label>
      <textarea id="grab-session-curl" value={curl} onChange={event => setCurl(event.target.value)}
        autoComplete="off" autoCapitalize="off" spellCheck={false} disabled={busy} required maxLength={64000}
        placeholder="Dán lệnh curl từ GrabFood…" rows={4}
        className="block w-full min-w-0 resize-y rounded-lg border border-input bg-background p-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2" />
      <p className="text-xs text-muted-foreground">
        Phiên được mã hóa khi lưu. Khi GrabFood yêu cầu xác thực lại, cập nhật cURL mới tại đây.
      </p>
      <Button type="submit" disabled={busy || !curl.trim()}><Save size={14} aria-hidden="true" />{saving ? "Đang kiểm tra…" : "Kết nối và lưu"}</Button>
    </form>}
  </section>;
}
