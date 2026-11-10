import Link from "next/link";
import { login } from "@/app/actions";
import { isAdmin } from "@/lib/admin-auth";
import { readStoreWithMenuRevision } from "@/lib/store";
import { getPublicMenu } from "@/lib/public-menu";
import { AdminPage } from "@/views/admin";

export const metadata = { title: "Quản lý · Xào Mì!", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) {
    const { store, menuRevision } = await readStoreWithMenuRevision();
    return <AdminPage store={store} menuRevision={menuRevision} publicMenu={getPublicMenu(store, Date.now())} />;
  }
  const { error } = await searchParams;
  return <main className="admin-workspace grid min-h-screen place-items-center px-4 py-10">
    <div className="admin-sheet w-full max-w-sm">
      <Link href="/" className="text-sm font-semibold text-primary">← Xem thực đơn</Link>
      <div className="mb-6 mt-5 flex items-center gap-3">
        <img src="/xao-mi-logo.jpg" alt="" className="size-14 rounded-full border border-[#edb76d] object-cover" />
        <h1 className="admin-heading text-3xl leading-tight">Quản lý Xào Mì!</h1>
      </div>
      <form action={login} className="grid gap-3">
        <label htmlFor="password" className="text-sm font-semibold">Mật khẩu quản trị</label>
        <input id="password" className="rounded-xl border border-input bg-card p-3" name="password" type="password" required autoComplete="current-password" />
        {error && <p role="alert" className="rounded-lg bg-primary/10 p-3 text-sm text-primary">Không đăng nhập được. Kiểm tra mật khẩu và cấu hình quản trị.</p>}
        <button className="rounded-xl bg-primary p-3 font-bold text-primary-foreground hover:bg-primary/90">Đăng nhập</button>
      </form>
    </div>
  </main>;
}
