import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Recuperar acesso.</h1>
          <p className="mt-2 text-sm text-muted">
            Informe seu e-mail e enviaremos uma nova senha provisória.
          </p>
        </div>

        <Card className="p-8">
          <ForgotForm />
        </Card>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
