import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  REFUNDED: "warning",
  CANCELED: "danger",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Ativo",
  REFUNDED: "Reembolsado",
  CANCELED: "Cancelado",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { userProducts: { include: { product: true }, orderBy: { purchaseDate: "desc" } } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="mt-1.5 text-sm text-muted">Clientes criados automaticamente a partir das compras na Hotmart.</p>
      </div>

      {users.length === 0 ? (
        <Card className="border-dashed p-12 text-center text-sm text-muted">Nenhum cliente cadastrado ainda.</Card>
      ) : (
        <>
          {/* Mobile: lista de cards (sem tabela, sem scroll lateral) */}
          <div className="space-y-3 sm:hidden">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <p className="font-medium">{user.name}</p>
                <p className="mt-0.5 text-sm text-muted break-all">{user.email}</p>

                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {user.userProducts.length === 0 ? (
                    <Badge tone="neutral">Sem produtos</Badge>
                  ) : (
                    user.userProducts.map((up) => (
                      <div key={up.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{up.product.name}</p>
                          <p className="text-xs text-muted-dim">
                            {up.purchaseDate.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge tone={statusTone[up.status]}>{statusLabel[up.status]}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop/tablet: tabela */}
          <Card className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-dim">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Produto(s)</th>
                  <th className="px-5 py-3 font-medium">Última compra</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium">{user.name}</td>
                    <td className="px-5 py-3.5 text-muted">{user.email}</td>
                    <td className="px-5 py-3.5">
                      {user.userProducts.length === 0 ? (
                        <span className="text-muted-dim">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {user.userProducts.map((up) => (
                            <span key={up.id}>{up.product.name}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-muted-dim">
                      {user.userProducts[0]?.purchaseDate.toLocaleDateString("pt-BR") ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {user.userProducts.length === 0 ? (
                          <Badge tone="neutral">Sem produtos</Badge>
                        ) : (
                          user.userProducts.map((up) => (
                            <Badge key={up.id} tone={statusTone[up.status]}>
                              {statusLabel[up.status]}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
