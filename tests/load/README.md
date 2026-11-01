# EGIA load testing

Use open-source k6 against a staging deployment.

Required scenarios:

1. **Baseline** — 5 minutes, normal read traffic, target P95 < 500ms for ordinary API routes.
2. **Peak** — 10 minutes, expected peak concurrent users, monitor DB connections, CPU and error rate.
3. **Stress** — increase concurrency until the error budget is exhausted; verify graceful degradation instead of process crashes.
4. **CBT** — isolate login/session/answer-submit traffic from normal school traffic.
5. **Queue** — enqueue report/import/notification jobs and verify workers drain backlog without duplicate execution.

Never run destructive load tests against production. Record DB connection saturation, slow queries, queue depth, job failure rate, HTTP 5xx, p95/p99 latency and storage errors for every run.
