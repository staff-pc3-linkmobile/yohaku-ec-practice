import { cookies } from "next/headers";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { database } from "./store";
export const guestCookieName = "yohaku_guest";
export const resumeCookieName = "yohaku_resume";
export const validToken = (token: unknown): token is string =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
}
export async function resolveLearningLink(token: string) {
  if (!validToken(token)) return null;
  return database().prepare("SELECT user_id FROM learning_links WHERE token_hash = ? AND expires_at > ?")
    .bind(await hashToken(token), Date.now()).first<{user_id: string}>();
}
export async function getVisitor(): Promise<{
  userId: string;
  kind: "account" | "guest" | "link";
} | null> {
  // An explicitly opened learning link selects that notebook, even on a signed-in PC.
  const saved = (await cookies()).get(resumeCookieName)?.value;
  if (saved) {
    const link = await resolveLearningLink(saved);
    if (link) return {userId: link.user_id, kind: "link"};
  }
  // Keep Sites' existing signed-in identity and its records.
  const account = await getChatGPTUser();
  if (account) return { userId: account.userId, kind: "account" };
  const token = (await cookies()).get(guestCookieName)?.value;
  if (!validToken(token)) return null;
  // A 256-bit browser capability, never exposed to client JS or persisted as plaintext.
  const hash = await hashToken(token);
  return { userId: "guest:" + hash, kind: "guest" };
}
