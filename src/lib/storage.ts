import "server-only";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type DownloadResult =
  | { type: "buffer"; buffer: Buffer; contentType: string }
  | { type: "redirect"; url: string };

const driver = process.env.STORAGE_DRIVER === "r2" ? "r2" : "local";

function localDir() {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || "./storage");
}

function localPath(key: string) {
  // key nunca deve conter ".." — validado por quem cria a key (sempre gerada pelo servidor).
  return path.join(localDir(), key);
}

let r2Client: S3Client | null = null;
function getR2Client() {
  if (r2Client) return r2Client;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID não configurado.");
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
  return r2Client;
}

function r2Bucket() {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET não configurado.");
  return bucket;
}

export async function storeFile(key: string, buffer: Buffer, contentType: string) {
  if (driver === "r2") {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: r2Bucket(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return;
  }

  const filePath = localPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  await writeFile(`${filePath}.meta.json`, JSON.stringify({ contentType }));
}

/** Só deve ser chamado depois que o chamador já validou o direito de acesso ao arquivo. */
export async function getFileForDownload(key: string, downloadFilename?: string): Promise<DownloadResult> {
  if (driver === "r2") {
    const url = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: r2Bucket(),
        Key: key,
        ...(downloadFilename
          ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` }
          : {}),
      }),
      { expiresIn: 60 }
    );
    return { type: "redirect", url };
  }

  const filePath = localPath(key);
  const buffer = await readFile(filePath);
  let contentType = "application/octet-stream";
  try {
    const meta = JSON.parse(await readFile(`${filePath}.meta.json`, "utf-8"));
    contentType = meta.contentType || contentType;
  } catch {
    // sem metadata, usa o content-type genérico
  }
  return { type: "buffer", buffer, contentType };
}

export async function deleteFile(key: string) {
  if (driver === "r2") {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }));
    return;
  }
  const filePath = localPath(key);
  await unlink(filePath).catch(() => {});
  await unlink(`${filePath}.meta.json`).catch(() => {});
}

export function generateStorageKey(contentId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `contents/${contentId}/${crypto.randomUUID()}-${safeName}`;
}
