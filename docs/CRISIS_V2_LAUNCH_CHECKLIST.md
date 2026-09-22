# Crisis Triage V2 — launch checklist (DPIA / legal / brand)

Engineering supports this checklist; client/legal owns sign-off.

## DPIA / GDPR

- [ ] DPIA completed for patient health-adjacent data stored under a family account
- [ ] ConsentRecord audit trail reviewed (self-attest, bewindvoerder/mentor, patient grant/revoke)
- [ ] Push notification payloads verified free of patient identifiers
- [ ] Retention policy for CareCase / TriageResponse / ConsentRecord documented

## Product disclosures

- [ ] AI / software-generated guidance shown on result, tasks, and guidance surfaces (NL + EN)
- [ ] Facility success-fee disclosure shown on directory contact (in-product, not only privacy policy)
- [ ] Copy never claims DigiD / CIZ / gemeente submission on the family's behalf

## Legal / brand (brief carry-overs)

- [ ] Named competitor comparisons (Filica, ZorgkaartNederland) parked or legally reviewed
- [ ] Phone number format normalized (E.164 + display)
- [ ] Email domain consistency (`shepherdsoud.com` vs `.nl`) resolved
- [ ] No ZorgkaartNederland data used for directory seed

## Cutover

- [x] Crisis triage is the primary family product (homepage + nav CTAs)
- [x] Old Care Guide family paths redirect to triage / dashboard
- [x] Legacy `/v2/*` URLs redirect to primary routes
- [ ] Haaglanden directory seed loaded beyond demo rows
- [ ] Checklist template URLs signed off by client
- [ ] Delete parked Care Guide family UI after soak period
