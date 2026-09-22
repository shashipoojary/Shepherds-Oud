/**
 * ponytail: assert one-way referral fee transitions.
 * Run: npx tsx scripts/check-referral-fee-transitions.ts
 */
import { canTransitionFeeStatus } from "../lib/crisis-v2/referral-fee-transitions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(canTransitionFeeStatus("PENDING", "INVOICED"), "pending→invoiced");
assert(canTransitionFeeStatus("PENDING", "PAID"), "pending→paid");
assert(canTransitionFeeStatus("PENDING", "DECLINED"), "pending→declined");
assert(canTransitionFeeStatus("INVOICED", "PAID"), "invoiced→paid");
assert(canTransitionFeeStatus("INVOICED", "DECLINED"), "invoiced→declined");
assert(!canTransitionFeeStatus("INVOICED", "PENDING"), "no reverse invoiced→pending");
assert(!canTransitionFeeStatus("PAID", "PENDING"), "paid is final");
assert(!canTransitionFeeStatus("PAID", "INVOICED"), "paid is final");
assert(!canTransitionFeeStatus("DECLINED", "PENDING"), "declined is final");
assert(!canTransitionFeeStatus("DECLINED", "INVOICED"), "declined is final");

console.log("referral-fee-transitions: ok");
