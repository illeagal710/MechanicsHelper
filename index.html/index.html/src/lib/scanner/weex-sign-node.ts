import { createHmac } from "node:crypto";
import { weexPrehash, weexSignHmac } from "./weex-sign.ts";

export function hmacSha256Base64(secret: string, msg: string): string {
  return createHmac("sha256", secret).update(msg).digest("base64");
}

export function weexAccessSign(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  queryString = "",
  body = "",
): string {
  return weexSignHmac(secret, weexPrehash(timestamp, method, path, queryString, body), hmacSha256Base64);
}
