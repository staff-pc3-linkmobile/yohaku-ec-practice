import { cookies } from "next/headers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export const guestCookieName = "yohaku_guest";
export async function getVisitor(): Promise<{
  userId: string;
  kind: "account" | "guest";
} | null> {
  // Keep Sites' existing signed-in identity and its records.
  const account = await getChatGPTUser();
  if (account) return { userId: account.userId, kind: "account" };
  const token = (await cookies()).get(guestCookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  // A 256-bit browser capability, never exposed to client JS or persisted as plaintext.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  const hash = Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  return { userId: "guest:" + hash, kind: "guest" };
}
