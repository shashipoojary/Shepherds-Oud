/**
 * Family load test — read-only, no auth required.
 *
 * Setup:
 *   1. npm run dev   (or npm run build && npm run start)
 *   2. Copy an intake id from Supabase: SELECT id FROM "Intake" LIMIT 1;
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e INTAKE_ID=your-id scripts/load-test/k6-family.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const INTAKE_ID = __ENV.INTAKE_ID;

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
  if (!INTAKE_ID) {
    throw new Error("Set INTAKE_ID env var");
  }

  const intake = http.get(`${BASE}/api/intakes/${INTAKE_ID}`);
  check(intake, { "intake 200": (r) => r.status === 200 });

  const matches = http.get(`${BASE}/api/matches?intakeId=${INTAKE_ID}`);
  check(matches, { "matches 200": (r) => r.status === 200 });

  sleep(3);
}
