// Lightweight mock for posting to n8n during local dev / demos.
// Provides the same signature as postToN8n but only logs.

export interface MockPostOptions {
  delayMs?: number;
}

export async function mockPostToN8n(
  identifier: string,
  body: Record<string, any>,
  _options: MockPostOptions = {},
): Promise<void> {
  const { delayMs = 200 } = _options;
  console.info("[mockPostToN8n]", identifier, body);
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
}
