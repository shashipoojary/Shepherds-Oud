/**
 * Provider load test — requires session cookie after magic-link login.
 *
 * Get cookie:
 *   1. Log in at /provider/login
 *   2. DevTools → Application → Cookies → copy session cookie
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e PROVIDER_COOKIE="better-auth.session_token=..." scripts/load-test/k6-provider.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const COOKIE = __ENV.PROVIDER_COOKIE;

export const options = {
  stages: [
    { duration: "20s", target: 3 },
    { duration: "1m", target: 10 },
    { duration: "20s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"]
  }
};

export default function () {
  if (!COOKIE) {
    throw new Error("Set PROVIDER_COOKIE env var");
  }

  const headers = { Cookie: COOKIE };

  const me = http.get(`${BASE}/api/provider/me`, { headers });
  check(me, {
    "provider me 200": (r) => r.status === 200,
    "has inquiries array": (r) => {
      try {
        return Array.isArray(r.json("inquiries"));
      } catch {
        return false;
      }
    }
  });

  sleep(10);
}
