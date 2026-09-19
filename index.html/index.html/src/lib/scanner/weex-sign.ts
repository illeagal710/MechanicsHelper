/** Official WEEX ACCESS-SIGN: HMAC-SHA256(timestamp + METHOD + path + ?query + body) then Base64.
 *  https://www.weex.com/api-doc/spot/QuickStart/Signature
 */
export function weexPrehash(
  timestamp: string,
  method: string,
  path: string,
  queryString = "",
  body = "",
): string {
  const qs = queryString ? `?${queryString}` : "";
  return `${timestamp}${method.toUpperCase()}${path}${qs}${body}`;
}

export function weexSignHmac(secret: string, prehash: string, hmacSha256Base64: (secret: string, msg: string) => string): string {
  return hmacSha256Base64(secret, prehash);
}
