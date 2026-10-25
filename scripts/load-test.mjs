import { PerformanceObserver, performance } from "node:perf_hooks";

async function runLoadTest(
  targetUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  totalRequests = 100,
  concurrency = 10
) {
  console.log(`Starting load test simulation against ${targetUrl}...`);
  console.log(`Target Requests: ${totalRequests} | Concurrency Level: ${concurrency}`);

  const start = performance.now();
  let succeeded = 0;
  let failed = 0;

  const makeRequest = async () => {
    try {
      const res = await fetch(`${targetUrl.replace(/\/$/, "")}/api/admin/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok || res.status === 401) {
        succeeded += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
    }
  };

  const pool = [];
  for (let i = 0; i < totalRequests; i += concurrency) {
    const chunk = Array.from({ length: Math.min(concurrency, totalRequests - i) }, () =>
      makeRequest()
    );
    await Promise.all(chunk);
  }

  const duration = (performance.now() - start) / 1000;
  const rps = (totalRequests / duration).toFixed(2);

  console.log(`\nLoad Test Completed in ${duration.toFixed(2)}s`);
  console.log(`Successful Requests: ${succeeded}`);
  console.log(`Failed Requests: ${failed}`);
  console.log(`Throughput: ${rps} req/sec`);
}

runLoadTest().catch(console.error);
