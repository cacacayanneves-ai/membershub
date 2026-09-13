"use client";

import { useActionState } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { File as FileIcon, Trash2, Upload } from "lucide-react";
import {
  updateContentAction,
  deleteContentAction,
  uploadContentFileAction,
  deleteContentFileAction,
  type ContentFormState,
  type FileFormState,
} from "./content-actions";
import type { Content, ContentFile } from "@prisma/client";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function ContentEditor({
  content,
  productId,
}: {
  content: Content & { files: ContentFile[] };
  productId: string;
}) {
  const updateAction = updateContentAction.bind(null, content.id, productId);
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(updateAction, {});

  const uploadAction = uploadContentFileAction.bind(null, content.id, productId);
  const [uploadState, uploadFormAction, uploadPending] = useActionState<FileFormState, FormData>(uploadAction, {});

  const formId = `content-form-${content.id}`;

  return (
    <Card className="p-5">
      <form id={formId} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`name-${content.id}`}>Nome</Label>
            <Input id={`name-${content.id}`} name="name" defaultValue={content.name} required />
          </div>
          <div>
            <Label htmlFor={`imageUrl-${content.id}`}>Imagem (opcional)</Label>
            <Input id={`imageUrl-${content.id}`} name="imageUrl" defaultValue={content.imageUrl ?? ""} placeholder="https://..." />
          </div>
        </div>
        <div>
          <Label htmlFor={`description-${content.id}`}>Descrição</Label>
          <Input id={`description-${content.id}`} name="description" defaultValue={content.description ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`order-${content.id}`}>Ordem</Label>
            <Input id={`order-${content.id}`} name="order" type="number" defaultValue={content.order} />
          </div>
          <div>
            <Label htmlFor={`releaseAfterDays-${content.id}`}>Disponível após (dias)</Label>
            <Input
              id={`releaseAfterDays-${content.id}`}
              name="releaseAfterDays"
              type="number"
              min={0}
              defaultValue={content.releaseAfterDays}
            />
          </div>
        </div>
        {state.error && <FieldError>{state.error}</FieldError>}
      </form>

      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" form={formId} size="sm" variant="secondary" disabled={pending}>
          {pending ? "Salvando..." : "Salvar conteúdo"}
        </Button>
        <form action={deleteContentAction.bind(null, content.id, productId)}>
          <ConfirmSubmitButton
            variant="danger"
            confirmText={`Excluir o conteúdo "${content.name}" e todos os seus arquivos?`}
          >
            Excluir conteúdo
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-dim">Arquivos</p>
        <div className="mb-3 space-y-1.5">
          {content.files.length === 0 && <p className="text-sm text-muted-dim">Nenhum arquivo ainda.</p>}
          {content.files.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileIcon className="size-3.5 shrink-0 text-muted-dim" />
                <span className="truncate text-sm">{file.label}</span>
                <span className="shrink-0 text-xs text-muted-dim">{formatBytes(file.sizeBytes)}</span>
              </div>
              <form action={deleteContentFileAction.bind(null, file.id, productId)}>
                <ConfirmSubmitButton variant="danger" confirmText={`Remover o arquivo "${file.label}"?`}>
                  <Trash2 className="size-3.5" />
                </ConfirmSubmitButton>
              </form>
            </div>
          ))}
        </div>

        <form action={uploadFormAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input name="label" placeholder="Nome do arquivo (opcional)" className="sm:max-w-52" />
          <input
            name="file"
            type="file"
            required
            className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={uploadPending}>
            <Upload className="size-3.5" />
            {uploadPending ? "Enviando..." : "Enviar"}
          </Button>
        </form>
        {uploadState.error && <FieldError>{uploadState.error}</FieldError>}
      </div>
    </Card>
  );
}
