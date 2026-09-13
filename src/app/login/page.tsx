import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.mustChangePassword ? "/primeiro-acesso" : user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex size-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
            <span className="font-semibold text-accent">M</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta.</h1>
          <p className="mt-2 text-sm text-muted">Entre para acessar seus produtos.</p>
        </div>

        <Card className="p-8">
          <LoginForm />
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          Esqueceu sua senha?{" "}
          <Link href="/esqueci-senha" className="font-medium text-accent hover:text-accent-hover">
            Recuperar acesso
          </Link>
        </p>
      </div>
    </div>
  );
}
