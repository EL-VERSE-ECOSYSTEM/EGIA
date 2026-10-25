import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function handleSendOtpEmail(payload: any) {
  console.log("Processing send_otp_email job:", payload);
}

async function handleWelcome(payload: any) {
  console.log("Processing send_welcome_email job:", payload);
}

async function handleCbtGrade(payload: any) {
  console.log("Processing grade_cbt_submission job:", payload);
}

async function handleNotifyParent(payload: any) {
  console.log("Processing notify_parent job:", payload);
}

const HANDLERS: Record<string, (payload: any) => Promise<void>> = {
  send_otp_email: handleSendOtpEmail,
  send_welcome_email: handleWelcome,
  grade_cbt_submission: handleCbtGrade,
  notify_parent: handleNotifyParent,
};

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization") ?? "";
  const expectedToken = Deno.env.get("WORKER_TOKEN");
  if (expectedToken && auth !== `Bearer ${expectedToken}`) {
    return new Response("forbidden", { status: 403 });
  }

  const workerId = `w-${crypto.randomUUID()}`;
  const queue = (await req.json().catch(() => ({}))).queue ?? "default";
  const start = Date.now();
  const budgetMs = 90_000;
  let processed = 0;

  while (Date.now() - start < budgetMs - 15_000) {
    const { data: jobs, error } = await sb.rpc("claim_jobs", {
      p_queue: queue,
      p_worker_id: workerId,
      p_batch_size: 5,
      p_lease_seconds: 120,
    });

    if (error) {
      console.error("claim_jobs RPC error:", error);
      break;
    }

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) break;

    for (const job of jobs) {
      if (Date.now() - start > budgetMs - 5_000) break;

      const handler = HANDLERS[job.type];
      if (!handler) {
        await sb.rpc("fail_job", {
          p_job_id: job.id,
          p_worker_id: workerId,
          p_error: `No handler configured for job.type = ${job.type}`,
        });
        continue;
      }

      try {
        await handler(job.payload);
        await sb.rpc("complete_job", { p_job_id: job.id, p_worker_id: workerId });
      } catch (err) {
        await sb.rpc("fail_job", {
          p_job_id: job.id,
          p_worker_id: workerId,
          p_error: String(err).slice(0, 2000),
        });
      }

      processed++;
    }
  }

  return Response.json({ ok: true, workerId, processed });
});
