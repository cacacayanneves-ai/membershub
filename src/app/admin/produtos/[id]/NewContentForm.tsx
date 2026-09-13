"use client";

import { useActionState } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Plus } from "lucide-react";
import { createContentAction, type ContentFormState } from "./content-actions";

export function NewContentForm({ productId }: { productId: string }) {
  const action = createContentAction.bind(null, productId);
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(action, {});

  return (
    <Card className="border-dashed p-5">
      <p className="mb-4 text-sm font-medium">Adicionar conteúdo</p>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="new-name">Nome</Label>
          <Input id="new-name" name="name" placeholder="Volume 02" required />
        </div>

        <ImageUploadField label="Imagem (opcional)" />
        <div>
          <Label htmlFor="new-description">Descrição</Label>
          <Input id="new-description" name="description" placeholder="Novas figurinhas exclusivas" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-order">Ordem</Label>
            <Input id="new-order" name="order" type="number" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="new-releaseAfterDays">Disponível após (dias)</Label>
            <Input id="new-releaseAfterDays" name="releaseAfterDays" type="number" min={0} defaultValue={0} />
          </div>
        </div>
        {state.error && <FieldError>{state.error}</FieldError>}
        <Button type="submit" size="sm" disabled={pending}>
          <Plus className="size-3.5" />
          {pending ? "Adicionando..." : "Adicionar conteúdo"}
        </Button>
      </form>
    </Card>
  );
}
