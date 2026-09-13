import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  PROCESSED: "success",
  RECEIVED: "neutral",
  IGNORED: "warning",
  ERROR: "danger",
};

const statusLabel: Record<string, string> = {
  PROCESSED: "Processado",
  RECEIVED: "Recebido",
  IGNORED: "Ignorado",
  ERROR: "Erro",
};

export default async function AdminWebhooksPage() {
  const events = await prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
        <p className="mt-1.5 text-sm text-muted">
          Eventos recebidos da Hotmart em <code className="text-xs">/api/webhooks/hotmart</code>.
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed p-12 text-center text-sm text-muted">Nenhum webhook recebido ainda.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {events.map((event) => (
            <details key={event.id} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{event.eventType}</p>
                  <p className="text-xs text-muted-dim">{event.buyerEmail ?? "sem e-mail"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {event.errorMessage && (
                    <span className="text-xs text-danger break-words">{event.errorMessage}</span>
                  )}
                  <Badge tone={statusTone[event.status]}>{statusLabel[event.status]}</Badge>
                  <span className="text-xs text-muted-dim whitespace-nowrap">
                    {event.createdAt.toLocaleString("pt-BR")}
                  </span>
                </div>
              </summary>
              <pre className="mt-3 max-h-72 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs text-muted">
                {JSON.stringify(event.rawPayload, null, 2)}
              </pre>
            </details>
          ))}
        </Card>
      )}
    </div>
  );
}
