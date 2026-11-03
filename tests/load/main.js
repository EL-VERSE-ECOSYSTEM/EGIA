import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Testing Specification for EL LEARNERS APP
// Scenarios:
// 1. Normal: 100 concurrent VUs
// 2. Peak: 500 concurrent VUs
// 3. CBT Stress: 1000 concurrent students taking exams
export const options = {
  scenarios: {
    normal_traffic: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    peak_traffic: {
      executor: 'ramping-vus',
      startTime: '2m',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // < 1% error rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Liveness health check
  const liveRes = http.get(`${BASE_URL}/api/health/live`);
  check(liveRes, {
    'live status is 200': (r) => r.status === 200,
  });

  // 2. Readiness check
  const readyRes = http.get(`${BASE_URL}/api/health/ready`);
  check(readyRes, {
    'ready status is 200': (r) => r.status === 200,
  });

  // 3. Public landing & demo
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
