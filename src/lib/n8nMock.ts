// Lightweight mock for n8n webhooks during UI development.
// Replace usages with real postToN8n when backend workflow is ready.
export interface MockN8nResult {
  ok: boolean;
  identifier: string;
  body: any;
  ts: string;
}

export async function mockPostToN8n(
  identifier: string,
  body: Record<string, any>,
): Promise<MockN8nResult> {
  // Simulate network latency
  await new Promise((res) => setTimeout(res, 500 + Math.random() * 400));
  const result: MockN8nResult = {
    ok: true,
    identifier,
    body,
    ts: new Date().toISOString(),
  };
  if (import.meta?.env?.MODE !== "production") {
    console.info("[n8n:mock]", identifier, result);
  }
  return result;
}

export function buildVideoAvatarPayload(
  action: string,
  data: Record<string, any>,
) {
  return {
    identifier: "videoAvatar",
    operation: action,
    meta: { source: "app", ts: new Date().toISOString() },
    ...data,
  };
}
