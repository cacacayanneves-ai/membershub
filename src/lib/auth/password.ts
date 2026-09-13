import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

const READABLE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** Senha provisória legível (sem caracteres ambíguos), enviada por e-mail após a compra. */
export function generateProvisionalPassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += READABLE_CHARS[randomInt(READABLE_CHARS.length)];
  }
  return out;
}
