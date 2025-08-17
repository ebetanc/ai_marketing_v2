// Unified E2E: validates BE (Supabase auth/RLS/CRUD) and FE (build + assets)
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { createServer } from "http";

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message);
    err.name = "AssertionError";
    throw err;
  }
}

async function runBEChecks() {
  const steps = [];
  const SUPABASE_URL = getEnv("VITE_SUPABASE_URL", "http://127.0.0.1:54321");
  const SUPABASE_ANON_KEY = getEnv(
    "VITE_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  );

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // User A: sign up, session, basic profile
  const emailA = `e2e_a_${Date.now()}@test.local`;
  const pwdA = "Test1234!";
  const signupA = await clientA.auth.signUp({ email: emailA, password: pwdA });
  steps.push({
    step: "A_signup",
    ok: !signupA.error,
    error: signupA.error?.message,
  });
  assert(!signupA.error, `A signup failed: ${signupA.error?.message}`);
  const sessA = await clientA.auth.getSession();
  steps.push({ step: "A_session", ok: !!sessA.data.session });
  assert(!!sessA.data.session, "A must have an active session");
  const userA = (await clientA.auth.getUser()).data.user;
  assert(!!userA?.id, "A user id missing");

  // A: companies CRUD (insert, select-own, update)
  const compA = await clientA
    .from("companies")
    .insert({
      brand_name: "E2E Co A",
      website: "https://a.example",
      owner_id: userA.id,
    })
    .select("id, owner_id, brand_name")
    .single();
  steps.push({
    step: "A_company_insert",
    ok: !compA.error,
    data: compA.data,
    error: compA.error?.message,
  });
  assert(
    !compA.error && compA.data.owner_id === userA.id,
    "A company insert failed or wrong owner"
  );
  const companyAId = compA.data.id;

  const listACompanies = await clientA
    .from("companies")
    .select("id, brand_name");
  steps.push({
    step: "A_company_select",
    ok: !listACompanies.error && (listACompanies.data || []).length >= 1,
  });
  assert(!listACompanies.error, "A companies select failed");

  const compAUpdate = await clientA
    .from("companies")
    .update({ brand_name: "E2E Co A Updated" })
    .eq("id", companyAId)
    .select("brand_name")
    .single();
  steps.push({
    step: "A_company_update",
    ok:
      !compAUpdate.error && compAUpdate.data.brand_name === "E2E Co A Updated",
  });
  assert(!compAUpdate.error, "A company update failed");

  // A: strategies (insert/select/update)
  const stratA = await clientA
    .from("strategies")
    .insert({
      company_id: companyAId,
      platforms: "Twitter, LinkedIn",
      angle1_header: "Angle 1",
    })
    .select("id, company_id")
    .single();
  steps.push({
    step: "A_strategy_insert",
    ok: !stratA.error,
    data: stratA.data,
    error: stratA.error?.message,
  });
  assert(!stratA.error, "A strategy insert failed");
  const strategyAId = stratA.data.id;

  const stratAUpdate = await clientA
    .from("strategies")
    .update({ platforms: "Twitter" })
    .eq("id", strategyAId)
    .select("platforms")
    .single();
  steps.push({
    step: "A_strategy_update",
    ok: !stratAUpdate.error && stratAUpdate.data.platforms === "Twitter",
  });
  assert(!stratAUpdate.error, "A strategy update failed");

  // A: ideas (insert/select/update) referencing strategy
  const ideaA = await clientA
    .from("ideas")
    .insert({
      header: "Idea A",
      description: "desc",
      angle_number: 1,
      strategy_id: strategyAId,
      company_id: companyAId,
    })
    .select("id, company_id, strategy_id")
    .single();
  steps.push({
    step: "A_idea_insert",
    ok: !ideaA.error,
    data: ideaA.data,
    error: ideaA.error?.message,
  });
  assert(!ideaA.error, "A idea insert failed");
  const ideaAId = ideaA.data.id;

  const ideaAUpdate = await clientA
    .from("ideas")
    .update({ description: "desc-upd" })
    .eq("id", ideaAId)
    .select("description")
    .single();
  steps.push({
    step: "A_idea_update",
    ok: !ideaAUpdate.error && ideaAUpdate.data.description === "desc-upd",
  });
  assert(!ideaAUpdate.error, "A idea update failed");

  // A: content tables with status defaults
  const twA = await clientA
    .from("twitter_content")
    .insert({ idea_id: ideaAId, content_body: "tw", post: false })
    .select("id, status, post")
    .single();
  steps.push({
    step: "A_twitter_insert",
    ok: !twA.error && twA.data.status === "draft",
  });
  assert(!twA.error, "A twitter insert failed");

  const liA = await clientA
    .from("linkedin_content")
    .insert({ idea_id: ideaAId, content_body: "li", post: true })
    .select("id, status, post")
    .single();
  steps.push({
    step: "A_linkedin_insert",
    ok: !liA.error && liA.data.status === "draft",
  });
  assert(!liA.error, "A linkedin insert failed");

  const nlA = await clientA
    .from("newsletter_content")
    .insert({ idea_id: ideaAId, content_body: "nl", post: null })
    .select("id, status, post")
    .single();
  steps.push({
    step: "A_newsletter_insert",
    ok: !nlA.error && nlA.data.status === "draft",
  });
  assert(!nlA.error, "A newsletter insert failed");

  // A: content fetch and delete one
  const twAFetch = await clientA
    .from("twitter_content")
    .select("id, idea_id")
    .eq("idea_id", ideaAId);
  steps.push({
    step: "A_twitter_fetch",
    ok: !twAFetch.error && (twAFetch.data || []).length >= 1,
  });
  assert(!twAFetch.error, "A twitter fetch failed");
  const delTwA = await clientA
    .from("twitter_content")
    .delete()
    .eq("id", twA.data.id);
  steps.push({ step: "A_twitter_delete", ok: !delTwA.error });
  assert(!delTwA.error, "A twitter delete failed");

  // real_estate_content owner-scoped for A
  const reBeforeA = await clientA
    .from("real_estate_content")
    .select("id")
    .order("id", { ascending: true });
  steps.push({
    step: "A_re_read_before",
    ok: !reBeforeA.error && (reBeforeA.data || []).length === 0,
    count: (reBeforeA.data || []).length,
  });
  assert(!reBeforeA.error, "A real_estate read failed");
  const reInsA = await clientA
    .from("real_estate_content")
    .insert({
      id: Date.now(),
      link_origin: "https://a.local/src",
      link_final: "https://a.local/final",
    })
    .select("id")
    .single();
  steps.push({ step: "A_re_insert", ok: !reInsA.error, id: reInsA.data?.id });
  assert(!reInsA.error, "A real_estate insert failed");
  const reAfterA = await clientA
    .from("real_estate_content")
    .select("id")
    .order("id", { ascending: true });
  steps.push({
    step: "A_re_read_after",
    ok: !reAfterA.error && (reAfterA.data || []).length >= 1,
  });
  assert(!reAfterA.error, "A real_estate fetch after failed");

  // A: critical auth flow - update password, sign out, sign back in
  const newPwdA = pwdA + "X";
  const updPwdA = await clientA.auth.updateUser({ password: newPwdA });
  steps.push({
    step: "A_password_update",
    ok: !updPwdA.error,
    error: updPwdA.error?.message,
  });
  assert(!updPwdA.error, "A password update failed");
  await clientA.auth.signOut();
  const signInA = await clientA.auth.signInWithPassword({
    email: emailA,
    password: newPwdA,
  });
  steps.push({
    step: "A_signin_after_pwd_change",
    ok: !signInA.error,
    error: signInA.error?.message,
  });
  assert(!signInA.error, "A re-signin failed after password change");

  // User B: sign up and verify cross-tenant isolation
  const emailB = `e2e_b_${Date.now()}@test.local`;
  const pwdB = "Test1234!";
  const signupB = await clientB.auth.signUp({ email: emailB, password: pwdB });
  steps.push({
    step: "B_signup",
    ok: !signupB.error,
    error: signupB.error?.message,
  });
  assert(!signupB.error, `B signup failed: ${signupB.error?.message}`);
  const userB = (await clientB.auth.getUser()).data.user;
  assert(!!userB?.id, "B user id missing");

  // B cannot see A's companies
  const listBCompanies = await clientB.from("companies").select("brand_name");
  const seesAUpdated = (listBCompanies.data || []).some(
    (r) => r.brand_name === "E2E Co A Updated"
  );
  steps.push({ step: "B_rls_companies_isolation", ok: !seesAUpdated });
  assert(!seesAUpdated, "B can see A's updated company name (RLS leak)");

  // B cannot insert idea for A's company
  const forbidIdeaB = await clientB.from("ideas").insert({
    header: "badB",
    description: "x",
    angle_number: 1,
    strategy_id: 1,
    company_id: companyAId,
  });
  steps.push({
    step: "B_rls_ideas_forbidden",
    ok: !!forbidIdeaB.error,
    status: forbidIdeaB.status,
  });
  assert(
    !!forbidIdeaB.error,
    "B should be blocked inserting idea for A's company"
  );

  // B inserts own company, strategy, idea, and content
  const compB = await clientB
    .from("companies")
    .insert({
      brand_name: "E2E Co B",
      website: "https://b.example",
      owner_id: userB.id,
    })
    .select("id")
    .single();
  steps.push({
    step: "B_company_insert",
    ok: !compB.error,
    id: compB.data?.id,
  });
  assert(!compB.error, "B company insert failed");
  const companyBId = compB.data.id;

  const stratB = await clientB
    .from("strategies")
    .insert({
      company_id: companyBId,
      platforms: "LinkedIn",
      angle1_header: "Angle B",
    })
    .select("id")
    .single();
  steps.push({
    step: "B_strategy_insert",
    ok: !stratB.error,
    id: stratB.data?.id,
  });
  assert(!stratB.error, "B strategy insert failed");

  const ideaB = await clientB
    .from("ideas")
    .insert({
      header: "Idea B",
      description: "b",
      angle_number: 1,
      strategy_id: stratB.data.id,
      company_id: companyBId,
    })
    .select("id")
    .single();
  steps.push({ step: "B_idea_insert", ok: !ideaB.error, id: ideaB.data?.id });
  assert(!ideaB.error, "B idea insert failed");

  const liB = await clientB
    .from("linkedin_content")
    .insert({ idea_id: ideaB.data.id, content_body: "liB", post: false })
    .select("id, status")
    .single();
  steps.push({
    step: "B_linkedin_insert",
    ok: !liB.error && liB.data.status === "draft",
  });
  assert(!liB.error, "B linkedin insert failed");

  // B real_estate isolation (empty then own insert)
  const reBeforeB = await clientB.from("real_estate_content").select("id");
  steps.push({
    step: "B_re_read_before",
    ok: !reBeforeB.error && (reBeforeB.data || []).length === 0,
  });
  const reInsB = await clientB
    .from("real_estate_content")
    .insert({
      id: Date.now() + 1,
      link_origin: "https://b.local/src",
      link_final: "https://b.local/final",
    })
    .select("id")
    .single();
  steps.push({ step: "B_re_insert", ok: !reInsB.error });

  return { ok: true, SUPABASE_URL, steps };
}

async function ensureFEBuilt() {
  const distDir = join(process.cwd(), "dist");
  const indexPath = join(distDir, "index.html");
  try {
    await fs.access(indexPath);
    return true;
  } catch {
    // Build if missing
    const res = spawnSync("npm", ["run", "-s", "vite:build"], {
      stdio: "inherit",
      shell: true,
    });
    return res.status === 0;
  }
}

async function runFEChecks() {
  const steps = [];
  const built = await ensureFEBuilt();
  steps.push({ step: "build_if_needed", ok: built });
  assert(built, "Build failed (vite:build)");

  const distDir = join(process.cwd(), "dist");
  const indexPath = join(distDir, "index.html");
  const html = await fs.readFile(indexPath, "utf8");
  steps.push({ step: "read_index", ok: true, bytes: html.length });
  assert(
    html.includes('<div id="root">') || html.includes('id="root"'),
    "index.html missing root div"
  );

  const jsMatch = html.match(/assets\/index-[A-Za-z0-9]+\.js/);
  assert(jsMatch, "No main JS asset reference found in index.html");
  const jsPath = join(distDir, jsMatch[0]);
  const jsStat = await fs.stat(jsPath);
  steps.push({
    step: "main_js_exists",
    ok: true,
    file: jsMatch[0],
    size: jsStat.size,
  });
  assert(jsStat.size > 0, "Main JS bundle is empty");

  // CSS bundle naming can vary (index-*.css or other). Match any CSS under assets.
  const cssMatch = html.match(/assets\/[A-Za-z0-9_-]+\.css/);
  assert(cssMatch, "No CSS asset reference found in index.html");
  const cssPath = join(distDir, cssMatch[0]);
  const cssStat = await fs.stat(cssPath);
  steps.push({
    step: "css_exists",
    ok: true,
    file: cssMatch[0],
    size: cssStat.size,
  });
  assert(cssStat.size > 0, "CSS bundle is empty");

  return { ok: true, steps };
}

// Start a tiny local HTTP server that records webhook POST bodies and paths
function startMockWebhookServer() {
  const received = [];
  const server = createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = { _raw: raw };
      }
      received.push({ method: req.method, url: req.url, body });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, port, received });
    });
  });
}

async function runWebhookChecks() {
  const steps = [];
  // Start mock server
  const { server, port, received } = await startMockWebhookServer();
  const base = `http://127.0.0.1:${port}`;

  try {
    // Make a temp user to produce a realistic user_id
    const SUPABASE_URL = getEnv("VITE_SUPABASE_URL", "http://127.0.0.1:54321");
    const SUPABASE_ANON_KEY = getEnv(
      "VITE_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    );
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const email = `e2e_webhook_${Date.now()}@test.local`;
    const pwd = "Test1234!";
    const sign = await tmp.auth.signUp({ email, password: pwd });
    steps.push({
      step: "WH_signup",
      ok: !sign.error,
      error: sign.error?.message,
    });
    assert(!sign.error, `Webhook test signup failed: ${sign.error?.message}`);
    const user = (await tmp.auth.getUser()).data.user;
    const userId = user?.id || null;
    steps.push({ step: "WH_user_id", ok: !!userId });
    assert(!!userId, "Webhook test missing user id");

    // Build UI-like payloads
    const payloads = [
      {
        path: "/webhook/content-saas",
        body: {
          identifier: "generateAngles",
          operation: "create_strategy_angles",
          company_id: 101,
          meta: {
            user_id: userId,
            source: "app",
            ts: new Date().toISOString(),
          },
          user_id: userId,
          brand: {
            id: 101,
            name: "Brand A",
            website: "https://example.com",
            brandTone: "friendly",
            keyOffer: "value",
            brandVoice: {
              tone: "friendly",
              style: "casual",
              keywords: ["ai", "marketing"],
            },
            targetAudience: "marketers",
            target_audience: {
              demographics: "25-40",
              interests: ["growth"],
              pain_points: [],
            },
            additionalInfo: "",
            imageGuidelines: "",
            createdAt: new Date().toISOString(),
          },
          platforms: ["twitter", "linkedin"],
          context: {
            requestType: "content_strategy_generation",
            timestamp: new Date().toISOString(),
          },
        },
        expect: {
          identifier: "generateAngles",
          operation: "create_strategy_angles",
          keys: ["company_id", "meta", "user_id", "brand", "platforms"],
        },
      },
      {
        path: "/webhook/content-saas",
        body: {
          identifier: "generateIdeas",
          operation: "create_ideas_from_angle",
          company_id: 201,
          strategy_id: 301,
          angle_number: 1,
          platforms: ["twitter", "linkedin", "", "", "", "", "", ""],
          meta: {
            user_id: userId,
            source: "app",
            ts: new Date().toISOString(),
          },
          user_id: userId,
          company: { id: 201, brand_name: "Brand B" },
          strategy: {
            id: 301,
            platforms: "Twitter, LinkedIn",
            created_at: new Date().toISOString(),
          },
          angle: {
            number: 1,
            header: "Angle",
            description: "desc",
            objective: "obj",
            tonality: "pro",
          },
        },
        expect: {
          identifier: "generateIdeas",
          operation: "create_ideas_from_angle",
          keys: [
            "company_id",
            "strategy_id",
            "angle_number",
            "platforms",
            "meta",
            "user_id",
          ],
        },
      },
      {
        path: "/webhook/content-saas",
        body: {
          identifier: "generateContent",
          operation: "generate_content_from_idea",
          meta: {
            user_id: userId,
            source: "app",
            ts: new Date().toISOString(),
          },
          user_id: userId,
          company_id: 201,
          strategy_id: 301,
          idea_id: 401,
          topic: {
            topicNumber: 1,
            topic: "Post",
            description: "",
            image_prompt: "",
            idea: {
              id: 401,
              brand: "Brand B",
              strategy_id: 301,
              angle_number: 1,
              created_at: new Date().toISOString(),
            },
          },
          platforms: ["twitter", "linkedin", "newsletter", "", "", "", "", ""],
          companyDetails: {
            id: 201,
            name: "Brand B",
            website: "",
            brandTone: "",
            keyOffer: "",
            targetAudience: "",
            additionalInfo: "",
          },
          angleDetails: {
            number: 1,
            header: "Angle",
            description: "",
            objective: "",
            tonality: "",
          },
          strategyContext: {
            id: 301,
            brand: "Brand B",
            name: "Brand B",
            description: "",
            platforms: "Twitter",
            created_at: new Date().toISOString(),
            totalAngles: 1,
          },
          aiContext: { contentType: "idea_to_content_generation" },
          context: {
            requestType: "generate_content_from_idea",
            timestamp: new Date().toISOString(),
          },
        },
  expect: {
          identifier: "generateContent",
          operation: "generate_content_from_idea",
          keys: [
            "company_id",
            "strategy_id",
            "idea_id",
            "meta",
            "user_id",
            "topic",
          ],
        },
      },
      {
        path: "/webhook/real-estate",
        body: {
          identifier: "content_saas",
          operation: "real_estate_ingest",
          url: "https://listing.example/property",
          user_id: userId,
          meta: {
            user_id: userId,
            source: "app",
            ts: new Date().toISOString(),
          },
        },
        expect: {
          identifier: "content_saas",
          operation: "real_estate_ingest",
          keys: ["url", "user_id", "meta"],
        },
      },
    ];

    for (const [idx, p] of payloads.entries()) {
      const res = await fetch(base + p.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p.body),
      });
      const ok = res.ok;
      steps.push({
        step: `WH_post_${idx + 1}_${p.body.identifier}`,
        ok,
        status: res.status,
      });
      assert(ok, `Webhook mock POST failed: ${p.body.identifier}`);
    }

    // Validate receipts
    assert(
      received.length === payloads.length,
      `Expected ${payloads.length} webhook hits, got ${received.length}`
    );
    payloads.forEach((p, i) => {
      const rec = received[i];
      const b = rec.body || {};
      const idOk = b.identifier === p.expect.identifier;
      const opOk = b.operation === p.expect.operation;
      const keysOk = p.expect.keys.every((k) => b[k] !== undefined);
      // Additional shape checks for fixed index platform slots
      let shapeOk = true;
      const ORDER = [
        "twitter",
        "linkedin",
        "newsletter",
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "blog",
      ];
      if (b.identifier === "generateIdeas" || b.identifier === "generateContent") {
        shapeOk =
          Array.isArray(b.platforms) &&
          b.platforms.length === 8 &&
          b.platforms.every(
            (it, idx) => typeof it === "string" && (it === "" || it === ORDER[idx])
          );
      }
      steps.push({
        step: `WH_validate_${i + 1}`,
        ok: idOk && opOk && keysOk && shapeOk,
        path: rec.url,
      });
      assert(
        idOk && opOk && keysOk && shapeOk,
        `Webhook payload ${i + 1} failed validation`
      );
      // user consistency
      if (b.meta?.user_id !== undefined && b.user_id !== undefined) {
        assert(
          b.meta.user_id === b.user_id,
          `meta.user_id and user_id mismatch for ${b.identifier}`
        );
      }
    });

    return { ok: true, steps };
  } finally {
    server.close();
  }
}

(async () => {
  const out = { be: null, fe: null, webhooks: null };
  try {
    out.be = await runBEChecks();
    out.fe = await runFEChecks();
    out.webhooks = await runWebhookChecks();
    console.log(
      JSON.stringify(
        { ok: out.be.ok && out.fe.ok && out.webhooks.ok, ...out },
        null,
        2
      )
    );
    process.exit(0);
  } catch (err) {
    console.error(
      JSON.stringify(
        { ok: false, error: String(err?.message || err), ...out },
        null,
        2
      )
    );
    process.exit(1);
  }
})();
