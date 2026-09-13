import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { logoutAction } from "@/lib/auth/actions";
import { Logo } from "@/components/logo";
import { LogOut } from "lucide-react";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo className="size-8" />
            <span className="text-sm font-semibold tracking-tight">Members Hub</span>
            <span className="ml-1 rounded-md border border-border-strong px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
              Admin
            </span>
          </Link>

          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
