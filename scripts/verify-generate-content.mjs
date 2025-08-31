#!/usr/bin/env node
// Self-contained contract verification for generateContent without importing TS modules.
const N8N_PLATFORM_ORDER = [
  "twitter",
  "linkedin",
  "newsletter",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "blog",
];
function normalizePlatforms(raw) {
  const slots = Array(8).fill("");
  if (!raw) return slots;
  raw
    .map((p) => (p || "").trim().toLowerCase())
    .filter(Boolean)
    .forEach((p) => {
      const idx = N8N_PLATFORM_ORDER.indexOf(p);
      if (idx !== -1) slots[idx] = p;
    });
  return slots;
}
function validateAndNormalizeN8nPayload(payload) {
  const errors = [];
  const warnings = [];
  if (!payload.meta) {
    warnings.push("meta missing; injecting");
    payload.meta = {};
  }
  if (!payload.meta.ts) payload.meta.ts = new Date().toISOString();
  if (!payload.meta.source) payload.meta.source = "app";
  ["company_id", "strategy_id", "idea_id", "topic", "platforms"].forEach(
    (k) => {
      if (payload[k] === undefined)
        errors.push(`generateContent: missing field '${k}'`);
    },
  );
  if (Array.isArray(payload.platforms)) {
    if (payload.platforms.length !== 8) {
      warnings.push("platforms wrong length; normalizing");
      payload.platforms = normalizePlatforms(payload.platforms);
    }
  } else {
    warnings.push("platforms not array; normalizing");
    payload.platforms = normalizePlatforms();
  }
  return { ok: errors.length === 0, errors, warnings, normalized: payload };
}

const dummyTopic = { number: 1, topic: "Test Topic", description: "Desc" };
const payload = {
  identifier: "generateContent",
  operation: "generate_content_from_idea",
  company_id: 123,
  strategy_id: 456,
  idea_id: 789,
  topic: dummyTopic,
  platforms: N8N_PLATFORM_ORDER, // intentionally correct
  meta: { user_id: "dev-user", source: "script" },
  user_id: "dev-user",
};

const result = validateAndNormalizeN8nPayload(payload);
console.log("Contract ok:", result.ok);
if (result.warnings.length) console.log("Warnings:", result.warnings);
if (result.errors.length) console.log("Errors:", result.errors);
if (!result.ok) process.exit(1);

if (process.env.DO_EXTERNAL_TEST === "1") {
  const fetch = globalThis.fetch || (await import("node-fetch")).default;
  const url = "https://n8n.srv856940.hstgr.cloud/webhook/content-saas";
  console.log("Posting test payload to n8n ...");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("HTTP status:", res.status);
  const text = await res.text();
  console.log("Response snippet:", text.slice(0, 200));
}
