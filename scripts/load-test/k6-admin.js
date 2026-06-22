/**
 * Admin load test — requires session cookie from browser login.
 *
 * Get cookie:
 *   1. Log in as admin at /login (Google)
 *   2. DevTools → Application → Cookies → copy full cookie header
 *      e.g. better-auth.session_token=...
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e ADMIN_COOKIE="better-auth.session_token=..." scripts/load-test/k6-admin.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const COOKIE = __ENV.ADMIN_COOKIE;

export const options = {
  stages: [
    { duration: "20s", target: 2 },
    { duration: "1m", target: 5 },
    { duration: "20s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<8000"]
  }
};

export default function () {
  if (!COOKIE) {
    throw new Error("Set ADMIN_COOKIE env var");
  }

  const headers = { Cookie: COOKIE };

  const dash = http.get(`${BASE}/api/admin/dashboard`, { headers });
  check(dash, {
    "admin dashboard 200": (r) => r.status === 200,
    "has families array": (r) => {
      try {
        return Array.isArray(r.json("families"));
      } catch {
        return false;
      }
    }
  });

  sleep(8);
}
