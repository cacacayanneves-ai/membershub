import { CheckCircle2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DownloadButton } from "@/components/download-button";
import type { Content, ContentFile } from "@prisma/client";

export function ContentUnlockedCard({ content }: { content: Content & { files: ContentFile[] } }) {
  return (
    <Card className="p-5 animate-fade-in">
      <div className="mb-1 flex items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={2.25} />
        <h3 className="font-medium">{content.name}</h3>
      </div>
      {content.description && <p className="text-sm text-muted">{content.description}</p>}

      {content.files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {content.files.map((file) => (
            <DownloadButton key={file.id} href={`/api/download/${file.id}`} label={file.label} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function ContentLockedCard({
  content,
  daysUntilUnlock,
}: {
  content: Pick<Content, "id" | "name" | "description">;
  daysUntilUnlock: number;
}) {
  return (
    <Card className="border-dashed p-5 opacity-70">
      <div className="mb-1 flex items-center gap-2">
        <Lock className="size-4 shrink-0 text-muted-dim" strokeWidth={2.25} />
        <h3 className="font-medium text-muted">{content.name}</h3>
      </div>
      <p className="text-sm text-muted-dim">
        Este conteúdo será liberado em breve.{" "}
        {daysUntilUnlock > 0 &&
          `Disponível em ${daysUntilUnlock} ${daysUntilUnlock === 1 ? "dia" : "dias"}.`}
      </p>
    </Card>
  );
}
