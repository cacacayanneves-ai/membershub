import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Package, Users, Webhook, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const [productCount, userCount, webhookCount, recentWebhooks] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.webhookEvent.count(),
    prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Produtos", value: productCount, href: "/admin/produtos", icon: Package },
    { label: "Clientes", value: userCount, href: "/admin/usuarios", icon: Users },
    { label: "Webhooks recebidos", value: webhookCount, href: "/admin/webhooks", icon: Webhook },
  ];

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">Visão geral da sua plataforma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="p-6 transition-colors hover:border-border-strong">
              <stat.icon className="mb-4 size-5 text-accent" strokeWidth={1.75} />
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-dim">Últimos webhooks</h2>
          <Link href="/admin/webhooks" className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover">
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {recentWebhooks.length === 0 ? (
          <p className="text-sm text-muted-dim">Nenhum webhook recebido ainda.</p>
        ) : (
          <Card className="divide-y divide-border">
            {recentWebhooks.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <div>
                  <p className="font-medium">{w.eventType}</p>
                  <p className="text-xs text-muted-dim">{w.buyerEmail ?? "sem e-mail"}</p>
                </div>
                <span className="text-xs text-muted-dim">{w.createdAt.toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
