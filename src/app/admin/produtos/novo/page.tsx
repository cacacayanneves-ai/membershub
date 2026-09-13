import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductForm } from "../ProductForm";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <Link href="/admin/produtos" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Voltar para produtos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo produto</h1>
        <p className="mt-1.5 text-sm text-muted">Depois de criar, você poderá adicionar os conteúdos.</p>
      </div>
      <Card className="p-6 sm:p-8">
        <ProductForm action={createProductAction} submitLabel="Criar produto" />
      </Card>
    </div>
  );
}
