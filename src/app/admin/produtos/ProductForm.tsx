"use client";

import { useActionState } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@prisma/client";
import type { ProductFormState } from "./actions";

type Action = (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;

export function ProductForm({
  action,
  product,
  submitLabel = "Salvar produto",
}: {
  action: Action;
  product?: Product;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, {});
  const priceDefault = product?.priceCents != null ? (product.priceCents / 100).toFixed(2).replace(".", ",") : "";

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do produto</Label>
        <Input id="name" name="name" defaultValue={product?.name} placeholder="Pack de Figurinhas — Volume 01" required />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
          rows={3}
          required
          className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <Label htmlFor="benefits">Benefícios (um por linha, usado na vitrine de upsell)</Label>
        <textarea
          id="benefits"
          name="benefits"
          defaultValue={product?.benefits ?? ""}
          rows={3}
          placeholder={"+50 figurinhas exclusivas\nAtualizações mensais\nUso comercial liberado"}
          className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">URL da imagem de capa</Label>
        <Input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl ?? ""} placeholder="https://..." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="hotmartProductId">Hotmart Product ID</Label>
          <Input id="hotmartProductId" name="hotmartProductId" defaultValue={product?.hotmartProductId ?? ""} placeholder="1234567" />
        </div>
        <div>
          <Label htmlFor="checkoutUrl">Checkout URL (Hotmart)</Label>
          <Input id="checkoutUrl" name="checkoutUrl" defaultValue={product?.checkoutUrl ?? ""} placeholder="https://pay.hotmart.com/..." />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" defaultValue={priceDefault} placeholder="39,90" />
        </div>
        <div>
          <Label htmlFor="order">Ordem de exibição</Label>
          <Input id="order" name="order" type="number" defaultValue={product?.order ?? 0} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "DRAFT"}
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="DRAFT">Rascunho</option>
            <option value="ACTIVE">Ativo</option>
          </select>
        </div>
      </div>

      {state.error && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
