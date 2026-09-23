/**
 * Family load test — public crisis triage surfaces (no auth).
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 scripts/load-test/k6-family.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "20s", target: 5 },
    { duration: "1m", target: 20 },
    { duration: "20s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<3000"]
  }
};

export default function () {
  const triage = http.get(`${BASE}/triage/1`);
  check(triage, { "triage 200": (r) => r.status === 200 });

  const directory = http.get(`${BASE}/api/v2/directory`);
  check(directory, { "directory 200": (r) => r.status === 200 });

  sleep(3);
}
