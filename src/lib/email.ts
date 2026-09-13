import "server-only";
import { Resend } from "resend";

function accessEmailHtml(params: { name: string; email: string; password: string; loginUrl: string; productName: string }) {
  const { name, email, password, loginUrl, productName } = params;
  return `
  <div style="background:#0a0a0c;padding:40px 24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#131316;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
      <p style="color:#7c6fff;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px;">Members Hub</p>
      <h1 style="color:#f5f5f7;font-size:22px;margin:0 0 12px;">Seu acesso está pronto, ${name.split(" ")[0]}.</h1>
      <p style="color:#9a9aa2;font-size:15px;line-height:1.6;margin:0 0 28px;">
        Sua compra de <strong style="color:#f5f5f7;">${productName}</strong> foi aprovada. Use as credenciais abaixo para acessar sua área exclusiva.
      </p>
      <div style="background:#0a0a0c;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <p style="color:#9a9aa2;font-size:13px;margin:0 0 4px;">E-mail</p>
        <p style="color:#f5f5f7;font-size:15px;margin:0 0 16px;">${email}</p>
        <p style="color:#9a9aa2;font-size:13px;margin:0 0 4px;">Senha provisória</p>
        <p style="color:#f5f5f7;font-size:15px;margin:0;font-family:ui-monospace,monospace;">${password}</p>
      </div>
      <a href="${loginUrl}" style="display:inline-block;background:#7c6fff;color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">Acessar minha área</a>
      <p style="color:#5c5c66;font-size:13px;line-height:1.6;margin:28px 0 0;">
        No primeiro acesso vamos pedir para você criar uma senha pessoal.
      </p>
    </div>
  </div>`;
}

function productUnlockedHtml(params: { name: string; productName: string; loginUrl: string }) {
  const { name, productName, loginUrl } = params;
  return `
  <div style="background:#0a0a0c;padding:40px 24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#131316;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
      <p style="color:#7c6fff;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px;">Members Hub</p>
      <h1 style="color:#f5f5f7;font-size:22px;margin:0 0 12px;">Novo produto liberado, ${name.split(" ")[0]}.</h1>
      <p style="color:#9a9aa2;font-size:15px;line-height:1.6;margin:0 0 28px;">
        <strong style="color:#f5f5f7;">${productName}</strong> já está disponível na sua área exclusiva. Entre com seu e-mail e senha de sempre.
      </p>
      <a href="${loginUrl}" style="display:inline-block;background:#7c6fff;color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">Acessar minha área</a>
    </div>
  </div>`;
}

export async function sendProductUnlockedEmail(params: { name: string; email: string; productName: string }) {
  const loginUrl = `${process.env.APP_URL || "http://localhost:3000"}/login`;
  const html = productUnlockedHtml({ ...params, loginUrl });
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:mock] Novo produto liberado para ${params.email}: ${params.productName}`);
    return { mocked: true as const };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Members Hub <acesso@example.com>",
    to: params.email,
    subject: `${params.productName} já está disponível 🎁`,
    html,
  });
  return { mocked: false as const, result };
}

export async function sendAccessEmail(params: {
  name: string;
  email: string;
  password: string;
  productName: string;
}) {
  const loginUrl = `${process.env.APP_URL || "http://localhost:3000"}/login`;
  const html = accessEmailHtml({ ...params, loginUrl });
  const subject = "Seu acesso à Members Hub está pronto 🎉";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[email:mock] Para ${params.email} — senha provisória: ${params.password}\n${html}`
    );
    return { mocked: true as const };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Members Hub <acesso@example.com>",
    to: params.email,
    subject,
    html,
  });
  return { mocked: false as const, result };
}
