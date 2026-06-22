/**
 * Mixed realistic load — family reads + optional admin/provider if cookies set.
 *
 * Run (family only):
 *   k6 run -e BASE_URL=http://localhost:3000 -e INTAKE_ID=xxx scripts/load-test/k6-mixed.js
 *
 * Run (full mix):
 *   k6 run -e BASE_URL=http://localhost:3000 -e INTAKE_ID=xxx -e ADMIN_COOKIE="..." -e PROVIDER_COOKIE="..." scripts/load-test/k6-mixed.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const INTAKE_ID = __ENV.INTAKE_ID;
const ADMIN_COOKIE = __ENV.ADMIN_COOKIE;
const PROVIDER_COOKIE = __ENV.PROVIDER_COOKIE;

export const options = {
  scenarios: {
    family: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 15 },
        { duration: "1m", target: 30 },
        { duration: "30s", target: 0 }
      ],
      exec: "familyFlow"
    },
    admin: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "1m", target: 3 },
        { duration: "30s", target: 0 }
      ],
      exec: "adminFlow",
      startTime: "5s"
    },
    provider: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 8 },
        { duration: "30s", target: 0 }
      ],
      exec: "providerFlow",
      startTime: "5s"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"]
  }
};

export function familyFlow() {
  if (!INTAKE_ID) return;
  http.batch([
    ["GET", `${BASE}/api/intakes/${INTAKE_ID}`],
    ["GET", `${BASE}/api/matches?intakeId=${INTAKE_ID}`]
  ]);
  sleep(4);
}

export function adminFlow() {
  if (!ADMIN_COOKIE) {
    sleep(10);
    return;
  }
  const res = http.get(`${BASE}/api/admin/dashboard`, { headers: { Cookie: ADMIN_COOKIE } });
  check(res, { "admin ok": (r) => r.status === 200 });
  sleep(10);
}

export function providerFlow() {
  if (!PROVIDER_COOKIE) {
    sleep(10);
    return;
  }
  const res = http.get(`${BASE}/api/provider/me`, { headers: { Cookie: PROVIDER_COOKIE } });
  check(res, { "provider ok": (r) => r.status === 200 });
  sleep(12);
}
