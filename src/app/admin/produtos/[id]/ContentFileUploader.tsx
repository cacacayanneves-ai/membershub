"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { requestContentFileUploadUrl, confirmContentFileUpload, uploadContentFileAction } from "./content-actions";

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
};

export function ContentFileUploader({ contentId, productId }: { contentId: string; productId: string }) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function uploadOne(file: File) {
    const presigned = await requestContentFileUploadUrl(contentId, file.name, file.type, file.size);
    if (presigned.error) throw new Error(presigned.error);

    if (presigned.direct && presigned.uploadUrl && presigned.key) {
      const res = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("Falha ao enviar para o storage.");
      const confirmed = await confirmContentFileUpload(contentId, productId, presigned.key, file.name, file.size);
      if (confirmed.error) throw new Error(confirmed.error);
      return;
    }

    // driver local (dev): sem URL assinada, envia pelo caminho tradicional
    const fd = new FormData();
    fd.append("file", file);
    fd.append("label", file.name);
    const result = await uploadContentFileAction(contentId, productId, {}, fd);
    if (result?.error) throw new Error(result.error);
  }

  async function handleFiles(fileList: FileList) {
    const selected = Array.from(fileList);
    setFiles(selected.map((f) => ({ name: f.name, status: "pending" })));
    setBusy(true);

    for (let i = 0; i < selected.length; i++) {
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f)));
      try {
        await uploadOne(selected[i]);
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f)));
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", message: err instanceof Error ? err.message : "Erro" } : f
          )
        );
      }
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        multiple
        disabled={busy}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = "";
        }}
        className="flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground disabled:opacity-50"
      />
      <p className="text-xs text-muted-dim">
        Selecione um ou vários arquivos de uma vez (no seletor do computador, use Ctrl/Cmd para marcar
        vários, ou Ctrl+A dentro de uma pasta pra pegar todos).
      </p>

      {files.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-background/50 p-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs">
              {f.status === "done" && <Check className="size-3.5 shrink-0 text-success" />}
              {f.status === "error" && <AlertCircle className="size-3.5 shrink-0 text-danger" />}
              {f.status === "uploading" && <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />}
              {f.status === "pending" && <Upload className="size-3.5 shrink-0 text-muted-dim" />}
              <span className="truncate">{f.name}</span>
              {f.message && <span className="shrink-0 text-danger">— {f.message}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
