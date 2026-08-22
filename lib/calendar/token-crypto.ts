import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { resolveCalendarCryptoSecret } from "@/lib/config/secrets";

function tokenSecret() {
  return createHash("sha256").update(resolveCalendarCryptoSecret()).digest();
}

/** Encrypt a token for DB storage (AES-256-GCM). Format: iv:tag:ciphertext hex. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted secret payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", tokenSecret(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
