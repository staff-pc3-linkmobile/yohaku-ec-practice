import { requireChatGPTUser } from "./chatgpt-auth";
import Storefront from "./storefront";
export const dynamic = "force-dynamic";
export default async function Home() {
  await requireChatGPTUser("/");
  return <Storefront />;
}
