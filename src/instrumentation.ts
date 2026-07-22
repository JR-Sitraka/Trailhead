import { startPoller } from "@/server/poller";

export async function register() {
  if (typeof window !== "undefined") return;
  startPoller(10000);
}
