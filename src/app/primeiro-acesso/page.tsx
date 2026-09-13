import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { FirstAccessForm } from "./FirstAccessForm";

export default async function FirstAccessPage() {
  const user = await requireUser();
  if (!user.mustChangePassword) {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Seu acesso está pronto! 🎉</h1>
          <p className="mt-2 text-sm text-muted">
            Antes de começar, crie uma senha pessoal.
          </p>
        </div>

        <Card className="p-8">
          <FirstAccessForm />
        </Card>
      </div>
    </div>
  );
}
