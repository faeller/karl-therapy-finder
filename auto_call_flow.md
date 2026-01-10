  6. Store in D1 → track status
  7. Webhook callback → ElevenLabs reports outcome (booked/no answer/rejected)
  8. Update contact status → reflect in user's contact list

  Push notifications added to medium-term in progress.md.

> okay, it's possible they didn't pick, which means we'll have to try again, it's also possible they say NO, I HATE AI; THEY HAVE TO DO IT THEMSELVES or Uhh my data privacy is being infringed, I don't want 
this etc. we'll need to take care of this too, give a full ascii graph of how all of this will work 

● ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                        KARL AUTO-CALL SYSTEM - FULL FLOW                         │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                                PHASE 1: SCHEDULING
  ═══════════════════════════════════════════════════════════════════════════════════

  USER CLICKS "Ruf für mich an"
              │
              ▼
  ┌───────────────────────────────────────┐
  │  PRE-FLIGHT CHECKS                    │
  │  ─────────────────                    │
  │  • User has Patreon tier >= Anrufer?  │
  │  • User has call credits remaining?   │
  │  • Therapist not in blocklist?        │
  └───────────────┬───────────────────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
      [PASS]          [FAIL]
          │               │
          │               ▼
          │       Show upgrade modal
          │       "Werde Anrufer-Supporter"
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  FETCH THERAPIST DETAILS                                                         │
  │  ───────────────────────                                                         │
  │                                                                                  │
  │  1. Check therapist_cache (D1) for e_id                                         │
  │     └─ if fresh (< 24h) → use cached                                            │
  │     └─ if stale/missing → fetch from TK                                         │
  │                                                                                  │
  │  2. GET https://tk-aerztefuehrer.de/TK/Suche_SN/index.js?e_id={e_id}           │
  │                                                                                  │
  │  3. Parse HTML → send to Haiku 4.5:                                             │
  │     "Extract opening hours, phone, special notes. Return JSON."                 │
  │                                                                                  │
  │  4. Store in therapist_cache                                                     │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  CALCULATE CALL SLOT                                                             │
  │  ───────────────────                                                             │
  │                                                                                  │
  │  Parsed hours example:                                                           │
  │  {                                                                               │
  │    "regular": [                                                                  │
  │      { "day": "tue", "start": "09:00", "end": "13:00" },                        │
  │      { "day": "tue", "start": "14:00", "end": "18:00" },                        │
  │      { "day": "wed", "start": "14:00", "end": "19:00" }                         │
  │    ],                                                                            │
  │    "sprechstunde": [                                                             │
  │      { "day": "tue", "start": "12:00", "end": "13:00" },                        │
  │      { "day": "thu", "start": "12:00", "end": "13:00" }                         │
  │    ],                                                                            │
  │    "notes": "nur nach Vereinbarung",                                            │
  │    "phone": "+49 911 3216480"                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  Algorithm:                                                                      │
  │  1. Prefer sprechstunde slots (dedicated phone times)                           │
  │  2. Fall back to regular hours                                                   │
  │  3. Add 10min buffer from now                                                   │
  │  4. Avoid lunch (12:30-13:30) unless sprechstunde                              │
  │  5. Avoid last 15min of any slot (they're wrapping up)                         │
  │                                                                                  │
  │  → next_slot: "2024-12-12T12:00:00+01:00"                                       │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  CREATE CALL RECORD (D1)                                                         │
  │  ───────────────────────                                                         │
  │                                                                                  │
  │  INSERT INTO scheduled_calls {                                                   │
  │    id: "call_xyz789",                                                           │
  │    user_id: "user_abc",                                                         │
  │    therapist_id: "ther_123",                                                    │
  │    therapist_name: "Frau Dipl.-Psych. Alexandra Hildebrandt",                  │
  │    therapist_phone: "+49 911 3216480",                                         │
  │    e_id: "2444909",                                                             │
  │    scheduled_at: "2024-12-12T12:00:00+01:00",                                   │
  │    attempt_number: 1,                                                            │
  │    max_attempts: 3,                                                              │
  │    status: "scheduled",                                                          │
  │    elevenlabs_conv_id: NULL,  // filled after API call                          │
  │    created_at: NOW()                                                             │
  │  }                                                                               │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  SCHEDULE WITH ELEVENLABS                                                        │
  │  ────────────────────────                                                        │
  │                                                                                  │
  │  POST https://api.elevenlabs.io/v1/convai/conversations                         │
  │                                                                                  │
  │  {                                                                               │
  │    "agent_id": "agent_karl_caller",                                             │
  │    "phone_number_to_call": "+49 911 3216480",                                   │
  │    "scheduled_time": "2024-12-12T12:00:00+01:00",                               │
  │    "first_message": "Guten Tag, hier ist ein Anruf im Auftrag von              │
  │                      Max Mustermann, der einen Therapieplatz sucht...",         │
  │    "dynamic_variables": {                                                        │
  │      "patient_name": "Max Mustermann",                                          │
  │      "patient_insurance": "Techniker Krankenkasse",                             │
  │      "therapy_type": "Verhaltenstherapie",                                      │
  │      "request": "Erstgespräch oder Probatorik",                                 │
  │      "callback_number": "+49 170 1234567",                                      │
  │      "urgency": "mittel"                                                         │
  │    },                                                                            │
  │    "webhook_url": "https://karl.app/api/calls/webhook",                         │
  │    "max_duration_seconds": 180                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  Response: { "conversation_id": "conv_abc123" }                                 │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  UPDATE CALL RECORD                                                              │
  │  ──────────────────                                                              │
  │                                                                                  │
  │  UPDATE scheduled_calls SET                                                      │
  │    elevenlabs_conv_id = "conv_abc123",                                          │
  │    status = "scheduled"                                                          │
  │  WHERE id = "call_xyz789"                                                        │
  │                                                                                  │
  │  UPDATE user_contacts SET                                                        │
  │    status = "call_scheduled",                                                    │
  │    scheduled_call_id = "call_xyz789"                                            │
  │  WHERE user_id = X AND therapist_id = Y                                         │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
                      RETURN TO USER:
                      "Anruf geplant für Do 12:00"
                      [Option: "Zeitpunkt ändern"]


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 2: CALL EXECUTION & OUTCOMES
  ═══════════════════════════════════════════════════════════════════════════════════

                          ELEVENLABS MAKES CALL
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  WEBHOOK: POST /api/calls/webhook                                                │
  │  ────────────────────────────────                                                │
  │                                                                                  │
  │  Payload from ElevenLabs:                                                        │
  │  {                                                                               │
  │    "conversation_id": "conv_abc123",                                            │
  │    "status": "completed" | "failed" | "no_answer",                              │
  │    "duration_seconds": 45,                                                       │
  │    "transcript": "...",                                                          │
  │    "analysis": {                    // from ElevenLabs agent                    │
  │      "outcome": "...",                                                           │
  │      "appointment_offered": true/false,                                          │
  │      "callback_requested": true/false,                                          │
  │      "rejection_reason": "..." | null                                           │
  │    }                                                                             │
  │  }                                                                               │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  HAIKU 4.5: ANALYZE TRANSCRIPT                                                   │
  │  ─────────────────────────────                                                   │
  │                                                                                  │
  │  Even with ElevenLabs analysis, we double-check with Haiku:                     │
  │                                                                                  │
  │  Prompt:                                                                         │
  │  "Analyze this therapy practice call transcript. Classify the outcome:          │
  │                                                                                  │
  │   - SUCCESS: Appointment booked or waitlist added                               │
  │   - CALLBACK: They'll call back or patient should call back                     │
  │   - NO_ANSWER: No pickup, voicemail, or busy                                    │
  │   - NO_AVAILABILITY: Full, not taking patients, long waitlist                   │
  │   - REJECTED_AI: Explicitly rejected AI/automated call                          │
  │   - REJECTED_PRIVACY: Concerned about data/DSGVO/third-party                    │
  │   - REJECTED_OTHER: Other rejection reason                                      │
  │   - UNCLEAR: Couldn't determine outcome                                         │
  │                                                                                  │
  │   Extract: appointment date/time if any, callback info, rejection reason."      │
  │                                                                                  │
  │  Output:                                                                         │
  │  {                                                                               │
  │    "outcome": "SUCCESS" | "CALLBACK" | "NO_ANSWER" | ...,                       │
  │    "confidence": 0.95,                                                           │
  │    "appointment": { "date": "2024-12-20", "time": "14:00" } | null,            │
  │    "callback_info": "Freitag vormittag zurückrufen" | null,                     │
  │    "rejection_reason": "Möchte dass Patient selbst anruft" | null,             │
  │    "waitlist_position": 12 | null,                                              │
  │    "notes": "Freundlich, aber voll bis März"                                    │
  │  }                                                                               │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                  ┌───────────────┴───────────────────────────────┐
                  │                                               │
                  ▼                                               ▼
  ┌───────────────────────────┐                   ┌───────────────────────────┐
  │  OUTCOME: SUCCESS         │                   │  OUTCOME: NO_ANSWER       │
  │  ─────────────────        │                   │  ───────────────────      │
  │                           │                   │                           │
  │  • Update contact →       │                   │  attempt < max_attempts?  │
  │    status: "success"      │                   │         │                 │
  │  • Store appointment      │                   │    ┌────┴────┐            │
  │  • Notify user:           │                   │    ▼         ▼            │
  │    "Termin am 20.12       │                   │  [YES]     [NO]           │
  │     um 14:00!"            │                   │    │         │            │
  │  • Deduct 1 call credit   │                   │    │         ▼            │
  │  • Mark call complete     │                   │    │   Mark "no_answer"   │
  │                           │                   │    │   Notify user:       │
  └───────────────────────────┘                   │    │   "Nicht erreicht    │
                                                  │    │    nach 3 Versuchen" │
                                                  │    │                      │
                                                  │    ▼                      │
                                                  │  SCHEDULE RETRY          │
                                                  │  ─────────────           │
                                                  │  • attempt_number++      │
                                                  │  • Next slot (different  │
                                                  │    day/time if possible) │
                                                  │  • Wait 4-24h between    │
                                                  │    attempts              │
                                                  │  • Notify user:          │
                                                  │    "Nicht erreicht,      │
                                                  │     versuche es morgen"  │
                                                  └───────────────────────────┘

                  ┌───────────────────────────────────────────────┐
                  │                                               │
                  ▼                                               ▼
  ┌───────────────────────────┐                   ┌───────────────────────────┐
  │  OUTCOME: CALLBACK        │                   │  OUTCOME: NO_AVAILABILITY │
  │  ─────────────────        │                   │  ────────────────────────  │
  │                           │                   │                           │
  │  • Update contact →       │                   │  • Update contact →       │
  │    status: "waiting"      │                   │    status: "rejected"     │
  │  • Store callback_info    │                   │  • Store reason:          │
  │  • Notify user:           │                   │    "Keine freien Plätze   │
  │    "Praxis meldet sich    │                   │     bis März 2025"        │
  │     [callback_info]"      │                   │  • Notify user            │
  │  • Set reminder for       │                   │  • Suggest: "Nächsten     │
  │    follow-up if no        │                   │    Therapeuten probieren" │
  │    response in 5 days     │                   │  • NO credit deducted     │
  │                           │                   │    (no successful contact)│
  └───────────────────────────┘                   └───────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 3: REJECTION HANDLING
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  OUTCOME: REJECTED_AI                                                            │
  │  "Die Praxis möchte keine automatisierten Anrufe"                               │
  │  ─────────────────────────────────────────────────                              │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  1. ADD TO BLOCKLIST                                                             │
  │     ─────────────────                                                            │
  │     INSERT INTO therapist_blocklist {                                            │
  │       e_id, therapist_name, reason: "ai_rejected",                              │
  │       reported_at, permanent: false                                              │
  │     }                                                                            │
  │                                                                                  │
  │  2. UPDATE CONTACT                                                               │
  │     ──────────────                                                               │
  │     status: "self_call_required"                                                │
  │     note: "Praxis bevorzugt persönliche Anrufe"                                 │
  │                                                                                  │
  │  3. NOTIFY USER                                                                  │
  │     ───────────                                                                  │
  │     "Diese Praxis nimmt keine automatisierten Anrufe an.                        │
  │      Du musst selbst anrufen. Ich erinnere dich zur Sprechstunde!"             │
  │                                                                                  │
  │  4. ENABLE SELF-CALL REMINDERS                                                   │
  │     ──────────────────────────                                                   │
  │     Schedule push notifications for this therapist's                            │
  │     opening hours (see cron worker)                                              │
  │                                                                                  │
  │  5. NO CREDIT DEDUCTED                                                           │
  │     ──────────────────                                                           │
  │     Unsuccessful due to practice policy, not our fault                          │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  OUTCOME: REJECTED_PRIVACY                                                       │
  │  "Datenschutzbedenken - wer ist KARL? Woher haben Sie die Nummer?"              │
  │  ──────────────────────────────────────────────────────────────────             │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  This is more serious - they might complain or take action                      │
  │                                                                                  │
  │  1. LOG INCIDENT                                                                 │
  │     ────────────                                                                 │
  │     INSERT INTO privacy_incidents {                                              │
  │       call_id, therapist_e_id, transcript_excerpt,                              │
  │       severity: "medium", created_at                                             │
  │     }                                                                            │
  │                                                                                  │
  │  2. ADD TO BLOCKLIST (permanent)                                                 │
  │     ─────────────────────────────                                                │
  │     INSERT INTO therapist_blocklist {                                            │
  │       e_id, reason: "privacy_concern",                                          │
  │       permanent: true,                                                           │
  │       notes: "Explizite DSGVO-Bedenken geäußert"                                │
  │     }                                                                            │
  │                                                                                  │
  │  3. NOTIFY USER (carefully worded)                                               │
  │     ──────────────────────────────                                               │
  │     "Diese Praxis hat Bedenken bezüglich automatisierter Anfragen.              │
  │      Um ihre Wünsche zu respektieren, wirst du selbst anrufen müssen.           │
  │      Keine Sorge - die Daten kamen aus dem öffentlichen TK Ärzteführer."       │
  │                                                                                  │
  │  4. UPDATE CONTACT                                                               │
  │     status: "self_call_required"                                                │
  │     flag: "privacy_sensitive"                                                    │
  │                                                                                  │
  │  5. INTERNAL ALERT                                                               │
  │     ──────────────                                                               │
  │     If severity high or repeated → alert admin                                  │
  │     Consider: should we proactively reach out to explain?                       │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  OUTCOME: REJECTED_OTHER                                                         │
  │  Various other rejection reasons                                                 │
  │  ───────────────────────────────                                                │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  Examples:                                                                       │
  │  • "Der Patient muss selbst anrufen" (common, not hostile)                      │
  │  • "Wir nehmen keine neuen Patienten von Vermittlern"                           │
  │  • "Bitte nur schriftliche Anfragen"                                            │
  │  • "Rufen Sie die andere Nummer an"                                             │
  │                                                                                  │
  │  HANDLING:                                                                       │
  │  ──────────                                                                      │
  │  1. Analyze rejection_reason with Haiku:                                        │
  │     - Is it hostile? → blocklist                                                │
  │     - Is it policy? → soft block (no auto-calls, but not hostile)              │
  │     - Is it redirecting? → store alternative contact method                     │
  │     - Is it temporary? → note and allow future attempts                         │
  │                                                                                  │
  │  2. Update contact with appropriate status and note                             │
  │                                                                                  │
  │  3. Notify user with actionable next steps                                      │
  │                                                                                  │
  │  4. If "schriftliche Anfragen" → offer to send email instead                   │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 4: RETRY LOGIC
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  RETRY SCHEDULING ALGORITHM                                                      │
  │  ──────────────────────────                                                      │
  │                                                                                  │
  │  attempt 1 failed (no_answer)                                                   │
  │        │                                                                         │
  │        ▼                                                                         │
  │  ┌─────────────────────────────────────────────┐                                │
  │  │  Calculate next attempt:                    │                                │
  │  │                                             │                                │
  │  │  • Min wait: 4 hours                        │                                │
  │  │  • Max wait: 48 hours                       │                                │
  │  │  • Prefer DIFFERENT day of week            │                                │
  │  │  • Prefer DIFFERENT time of day            │                                │
  │  │    (morning→afternoon or vice versa)        │                                │
  │  │  • Still within opening hours!              │                                │
  │  │                                             │                                │
  │  │  Example:                                   │                                │
  │  │  Attempt 1: Tuesday 10:00 → no answer      │                                │
  │  │  Attempt 2: Wednesday 15:00                 │                                │
  │  │  Attempt 3: Friday 11:00                    │                                │
  │  └─────────────────────────────────────────────┘                                │
  │                                                                                  │
  │  MAX ATTEMPTS: 3                                                                 │
  │  ─────────────                                                                   │
  │  After 3 failed attempts:                                                        │
  │  • Mark contact as "unreachable"                                                │
  │  • Notify user: "Nach 3 Versuchen nicht erreicht"                              │
  │  • Suggest: "Selbst anrufen" or "Nächsten Therapeuten"                         │
  │  • Partial credit refund? (policy decision)                                     │
  │                                                                                  │
  │  USER CAN:                                                                       │
  │  ─────────                                                                       │
  │  • Manually trigger retry (uses another attempt)                                │
  │  • Cancel scheduled retry                                                        │
  │  • Switch to self-call mode                                                      │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 5: DATABASE SCHEMA
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  scheduled_calls                                                                 │
  │  ───────────────                                                                 │
  │  id                  TEXT PRIMARY KEY                                           │
  │  user_id             TEXT NOT NULL → users.id                                   │
  │  therapist_id        TEXT NOT NULL                                              │
  │  therapist_name      TEXT                                                        │
  │  therapist_phone     TEXT NOT NULL                                              │
  │  e_id                TEXT                    // TK Ärzteführer ID              │
  │  elevenlabs_conv_id  TEXT                    // from ElevenLabs API             │
  │  scheduled_at        DATETIME NOT NULL                                          │
  │  attempt_number      INTEGER DEFAULT 1                                          │
  │  max_attempts        INTEGER DEFAULT 3                                          │
  │  status              TEXT                    // see below                        │
  │  outcome             TEXT                    // see below                        │
  │  transcript          TEXT                    // full call transcript            │
  │  analysis            TEXT                    // JSON from Haiku                 │
  │  appointment_date    TEXT                    // if booked                       │
  │  appointment_time    TEXT                                                        │
  │  callback_info       TEXT                    // if callback requested           │
  │  rejection_reason    TEXT                    // if rejected                     │
  │  notes               TEXT                                                        │
  │  created_at          DATETIME                                                    │
  │  updated_at          DATETIME                                                    │
  │  completed_at        DATETIME                                                    │
  │                                                                                  │
  │  status enum:                                                                    │
  │    scheduled, in_progress, completed, failed, cancelled                         │
  │                                                                                  │
  │  outcome enum:                                                                   │
  │    success, callback, no_answer, no_availability,                               │
  │    rejected_ai, rejected_privacy, rejected_other, unclear                       │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  therapist_blocklist                                                             │
  │  ───────────────────                                                             │
  │  id                  TEXT PRIMARY KEY                                           │
  │  e_id                TEXT UNIQUE NOT NULL                                       │
  │  therapist_name      TEXT                                                        │
  │  reason              TEXT                    // ai_rejected, privacy_concern,   │
  │                                              // hostile, other                   │
  │  details             TEXT                    // specific notes                  │
  │  permanent           BOOLEAN DEFAULT false                                      │
  │  reported_by_user    TEXT                    // who triggered the block        │
  │  created_at          DATETIME                                                    │
  │  expires_at          DATETIME                // for non-permanent blocks       │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  therapist_cache                                                                 │
  │  ───────────────                                                                 │
  │  e_id                TEXT PRIMARY KEY                                           │
  │  name                TEXT                                                        │
  │  phone               TEXT                                                        │
  │  address             TEXT                                                        │
  │  opening_hours       TEXT                    // JSON structured hours           │
  │  specialties         TEXT                    // JSON array                      │
  │  languages           TEXT                    // JSON array                      │
  │  accessibility       TEXT                    // JSON                            │
  │  raw_html            TEXT                    // for re-parsing if needed       │
  │  fetched_at          DATETIME                                                    │
  │  expires_at          DATETIME                                                    │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  privacy_incidents                                                               │
  │  ─────────────────                                                               │
  │  id                  TEXT PRIMARY KEY                                           │
  │  call_id             TEXT → scheduled_calls.id                                  │
  │  therapist_e_id      TEXT                                                        │
  │  severity            TEXT                    // low, medium, high               │
  │  transcript_excerpt  TEXT                    // relevant portion                │
  │  action_taken        TEXT                    // what we did                     │
  │  admin_reviewed      BOOLEAN DEFAULT false                                      │
  │  created_at          DATETIME                                                    │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  user_call_credits                                                               │
  │  ─────────────────                                                               │
  │  user_id             TEXT PRIMARY KEY → users.id                                │
  │  credits_total       INTEGER DEFAULT 0      // from Patreon tier               │
  │  credits_used        INTEGER DEFAULT 0                                          │
  │  credits_refunded    INTEGER DEFAULT 0                                          │
  │  last_refill_at      DATETIME               // monthly refill                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 6: API ENDPOINTS
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  POST /api/calls/schedule                                                        │
  │  ────────────────────────                                                        │
  │  Auth: Required (Patreon tier check)                                            │
  │  Body: { therapist_id, e_id }                                                   │
  │  Returns: { call_id, scheduled_at, attempt_number }                             │
  │  Errors: 402 (no credits), 403 (blocked therapist), 400 (invalid)              │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  POST /api/calls/webhook                                                         │
  │  ───────────────────────                                                         │
  │  Auth: ElevenLabs signature verification                                        │
  │  Body: { conversation_id, status, transcript, ... }                             │
  │  Returns: 200 OK                                                                 │
  │  Side effects: Updates DB, triggers notifications, schedules retries            │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  GET /api/calls/status/:call_id                                                  │
  │  ──────────────────────────────                                                  │
  │  Auth: Required (must own the call)                                             │
  │  Returns: { status, outcome, scheduled_at, appointment, notes, ... }            │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  POST /api/calls/:call_id/cancel                                                 │
  │  ───────────────────────────────                                                 │
  │  Auth: Required (must own the call)                                             │
  │  Cancels scheduled call, refunds credit if not yet attempted                    │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  POST /api/calls/:call_id/retry                                                  │
  │  ──────────────────────────────                                                  │
  │  Auth: Required                                                                  │
  │  Manually trigger retry (if attempts remaining)                                 │
  │  Body: { preferred_time?: string }                                              │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  GET /api/therapists/:e_id/details                                               │
  │  ─────────────────────────────────                                               │
  │  Auth: Optional                                                                  │
  │  Returns cached therapist details (hours, phone, etc.)                          │
  │  Fetches from TK if not cached                                                   │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           VISUAL: COMPLETE STATE MACHINE
  ═══════════════════════════════════════════════════════════════════════════════════

                                ┌─────────────┐
                                │  SCHEDULED  │
                                └──────┬──────┘
                                       │
                            call time arrives
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  IN_PROGRESS    │
                              └────────┬────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
                      ▼                ▼                ▼
              ┌───────────┐    ┌───────────┐    ┌───────────┐
              │  PICKUP   │    │ NO_ANSWER │    │  FAILED   │
              └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                    │                │                │
        ┌───────────┼───────────┐    │          technical
        │           │           │    │          error
        ▼           ▼           ▼    │                │
  ┌─────────┐ ┌──────────┐ ┌────────┐│                ▼
  │ SUCCESS │ │ CALLBACK │ │REJECTED││         ┌───────────┐
  └────┬────┘ └────┬─────┘ └───┬────┘│         │  REFUND   │
       │           │           │     │         │  + RETRY  │
       │           │     ┌─────┴─────┴─┐       └───────────┘
       │           │     │             │
       │           │     ▼             ▼
       │           │  ┌──────┐   ┌───────────┐
       │           │  │  AI  │   │  PRIVACY  │
       │           │  └──┬───┘   └─────┬─────┘
       │           │     │             │
       │           │     ▼             ▼
       │           │  blocklist    blocklist
       │           │  (soft)      (permanent)
       │           │     │             │
       │           │     └──────┬──────┘
       │           │            │
       │           │            ▼
       │           │     ┌─────────────┐
       │           │     │ SELF_CALL   │
       │           │     │ REQUIRED    │
       │           │     └─────────────┘
       │           │
       │           ▼
       │    ┌─────────────┐     attempts < max?
       │    │   WAITING   │◄────────────────────┐
       │    │ (callback)  │                     │
       │    └─────────────┘           ┌─────────┴──────────┐
       │                              │  RETRY_SCHEDULED   │
       │                              └────────────────────┘
       │                                        ▲
       │                                        │
       │                              ┌─────────┴──────────┐
       │                              │    NO_ANSWER       │
       │                              │  (attempts < max)  │
       │                              └────────────────────┘
       │
       ▼
  ┌─────────────────┐
  │    COMPLETE     │
  │  (appointment   │
  │    booked!)     │
  └─────────────────┘

> we also need to track the costs for elevenlabs, anthropic, etc. etc. 

● ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                        KARL AUTO-CALL SYSTEM - FULL FLOW                         │
  │                            (with Cost Tracking)                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                                PHASE 1: SCHEDULING
  ═══════════════════════════════════════════════════════════════════════════════════

  USER CLICKS "Ruf für mich an"
              │
              ▼
  ┌───────────────────────────────────────┐
  │  PRE-FLIGHT CHECKS                    │
  │  ─────────────────                    │
  │  • User has Patreon tier >= Anrufer?  │
  │  • User has call credits remaining?   │
  │  • Therapist not in blocklist?        │
  └───────────────┬───────────────────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
      [PASS]          [FAIL]
          │               │
          │               ▼
          │       Show upgrade modal
          │       "Werde Anrufer-Supporter"
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  FETCH THERAPIST DETAILS                                                         │
  │  ───────────────────────                                                         │
  │                                                                                  │
  │  1. Check therapist_cache (D1) for e_id                                         │
  │     └─ if fresh (< 24h) → use cached                                            │
  │     └─ if stale/missing → fetch from TK                                         │
  │                                                                                  │
  │  2. GET https://tk-aerztefuehrer.de/TK/Suche_SN/index.js?e_id={e_id}           │
  │                                                                                  │
  │  3. Parse HTML → send to Haiku 4.5:                                             │
  │     "Extract opening hours, phone, special notes. Return JSON."                 │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  💰 COST EVENT: haiku_parse_hours                                       │    │
  │  │     model: claude-3-5-haiku                                             │    │
  │  │     input_tokens: ~800, output_tokens: ~200                             │    │
  │  │     cost: ~$0.0003                                                       │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  │                                                                                  │
  │  4. Store in therapist_cache                                                     │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  CALCULATE CALL SLOT                                                             │
  │  ───────────────────                                                             │
  │                                                                                  │
  │  Parsed hours example:                                                           │
  │  {                                                                               │
  │    "regular": [                                                                  │
  │      { "day": "tue", "start": "09:00", "end": "13:00" },                        │
  │      { "day": "tue", "start": "14:00", "end": "18:00" },                        │
  │      { "day": "wed", "start": "14:00", "end": "19:00" }                         │
  │    ],                                                                            │
  │    "sprechstunde": [                                                             │
  │      { "day": "tue", "start": "12:00", "end": "13:00" },                        │
  │      { "day": "thu", "start": "12:00", "end": "13:00" }                         │
  │    ],                                                                            │
  │    "notes": "nur nach Vereinbarung",                                            │
  │    "phone": "+49 911 3216480"                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  Algorithm:                                                                      │
  │  1. Prefer sprechstunde slots (dedicated phone times)                           │
  │  2. Fall back to regular hours                                                   │
  │  3. Add 10min buffer from now                                                   │
  │  4. Avoid lunch (12:30-13:30) unless sprechstunde                              │
  │  5. Avoid last 15min of any slot (they're wrapping up)                         │
  │                                                                                  │
  │  → next_slot: "2024-12-12T12:00:00+01:00"                                       │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  CREATE CALL RECORD (D1)                                                         │
  │  ───────────────────────                                                         │
  │                                                                                  │
  │  INSERT INTO scheduled_calls {                                                   │
  │    id: "call_xyz789",                                                           │
  │    user_id: "user_abc",                                                         │
  │    therapist_id: "ther_123",                                                    │
  │    therapist_name: "Frau Dipl.-Psych. Alexandra Hildebrandt",                  │
  │    therapist_phone: "+49 911 3216480",                                         │
  │    e_id: "2444909",                                                             │
  │    scheduled_at: "2024-12-12T12:00:00+01:00",                                   │
  │    attempt_number: 1,                                                            │
  │    max_attempts: 3,                                                              │
  │    status: "scheduled",                                                          │
  │    elevenlabs_conv_id: NULL,                                                    │
  │    created_at: NOW()                                                             │
  │  }                                                                               │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  SCHEDULE WITH ELEVENLABS                                                        │
  │  ────────────────────────                                                        │
  │                                                                                  │
  │  POST https://api.elevenlabs.io/v1/convai/conversations                         │
  │                                                                                  │
  │  {                                                                               │
  │    "agent_id": "agent_karl_caller",                                             │
  │    "phone_number_to_call": "+49 911 3216480",                                   │
  │    "scheduled_time": "2024-12-12T12:00:00+01:00",                               │
  │    "first_message": "Guten Tag, hier ist ein Anruf im Auftrag von              │
  │                      Max Mustermann, der einen Therapieplatz sucht...",         │
  │    "dynamic_variables": {                                                        │
  │      "patient_name": "Max Mustermann",                                          │
  │      "patient_insurance": "Techniker Krankenkasse",                             │
  │      "therapy_type": "Verhaltenstherapie",                                      │
  │      "request": "Erstgespräch oder Probatorik",                                 │
  │      "callback_number": "+49 170 1234567",                                      │
  │      "urgency": "mittel"                                                         │
  │    },                                                                            │
  │    "webhook_url": "https://karl.app/api/calls/webhook",                         │
  │    "max_duration_seconds": 180                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  Response: { "conversation_id": "conv_abc123" }                                 │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  💰 COST EVENT: elevenlabs_call_scheduled                               │    │
  │  │     (actual cost tracked after call completes)                          │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
                      RETURN TO USER:
                      "Anruf geplant für Do 12:00"


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 2: CALL EXECUTION & OUTCOMES
  ═══════════════════════════════════════════════════════════════════════════════════

                          ELEVENLABS MAKES CALL
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  WEBHOOK: POST /api/calls/webhook                                                │
  │  ────────────────────────────────                                                │
  │                                                                                  │
  │  Payload from ElevenLabs:                                                        │
  │  {                                                                               │
  │    "conversation_id": "conv_abc123",                                            │
  │    "status": "completed" | "failed" | "no_answer",                              │
  │    "duration_seconds": 45,                                                       │
  │    "transcript": "...",                                                          │
  │    "cost": {                         // ElevenLabs provides this!               │
  │      "total_credits": 15,                                                        │
  │      "tts_credits": 8,                                                           │
  │      "stt_credits": 5,                                                           │
  │      "telephony_credits": 2                                                      │
  │    }                                                                             │
  │  }                                                                               │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  💰 COST EVENT: elevenlabs_call_completed                               │    │
  │  │     call_id: "call_xyz789"                                              │    │
  │  │     duration_seconds: 45                                                 │    │
  │  │     elevenlabs_credits: 15                                               │    │
  │  │     estimated_cost_usd: $0.15  (based on credit pricing)                │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  HAIKU 4.5: ANALYZE TRANSCRIPT                                                   │
  │  ─────────────────────────────                                                   │
  │                                                                                  │
  │  Prompt:                                                                         │
  │  "Analyze this therapy practice call transcript. Classify the outcome:          │
  │   - SUCCESS / CALLBACK / NO_ANSWER / NO_AVAILABILITY                            │
  │   - REJECTED_AI / REJECTED_PRIVACY / REJECTED_OTHER / UNCLEAR                   │
  │   Extract: appointment date/time, callback info, rejection reason."             │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  💰 COST EVENT: haiku_analyze_transcript                                │    │
  │  │     call_id: "call_xyz789"                                              │    │
  │  │     model: claude-3-5-haiku                                             │    │
  │  │     input_tokens: ~1500 (transcript), output_tokens: ~300               │    │
  │  │     cost: ~$0.0005                                                       │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  └───────────────────────────────┬─────────────────────────────────────────────────┘
                                  │
                                  ▼
                      [OUTCOME HANDLING - same as before]


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 3: COST TRACKING SYSTEM
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  COST EVENTS TABLE                                                               │
  │  ─────────────────                                                               │
  │                                                                                  │
  │  Every API call that costs money creates a cost_event:                          │
  │                                                                                  │
  │  cost_events {                                                                   │
  │    id                TEXT PRIMARY KEY                                           │
  │    timestamp         DATETIME NOT NULL                                          │
  │    user_id           TEXT → users.id (nullable for system ops)                 │
  │    call_id           TEXT → scheduled_calls.id (nullable)                      │
  │    provider          TEXT NOT NULL    // elevenlabs, anthropic, openai, etc    │
  │    operation         TEXT NOT NULL    // see operation types below             │
  │    model             TEXT             // claude-3-5-haiku, etc                 │
  │    input_tokens      INTEGER          // for LLM calls                         │
  │    output_tokens     INTEGER          // for LLM calls                         │
  │    duration_seconds  INTEGER          // for voice calls                        │
  │    provider_credits  DECIMAL          // provider's internal credits           │
  │    cost_usd          DECIMAL NOT NULL // our calculated cost in USD            │
  │    cost_eur          DECIMAL          // converted at time of event            │
  │    metadata          TEXT             // JSON blob for extra details           │
  │  }                                                                               │
  │                                                                                  │
  │  OPERATION TYPES:                                                                │
  │  ────────────────                                                                │
  │  anthropic:                                                                      │
  │    • haiku_parse_hours        (~$0.0003)  - parse therapist page               │
  │    • haiku_analyze_transcript (~$0.0005)  - analyze call result                │
  │    • haiku_classify_rejection (~$0.0002)  - determine rejection type           │
  │    • sonnet_complex_analysis  (~$0.003)   - edge cases needing smarter model   │
  │                                                                                  │
  │  elevenlabs:                                                                     │
  │    • call_completed           (~$0.10-0.30) - per call, varies by duration     │
  │    • call_failed              (~$0.02)      - connection failed, minimal cost  │
  │    • call_no_answer           (~$0.05)      - rang but no pickup               │
  │                                                                                  │
  │  other:                                                                          │
  │    • tk_api_fetch             (free)        - just tracking volume             │
  │    • push_notification        (~$0.0001)    - if using paid push service       │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  COST TRACKING HELPER                                                            │
  │  ────────────────────                                                            │
  │                                                                                  │
  │  // src/lib/server/costs.ts                                                      │
  │                                                                                  │
  │  const PRICING = {                                                               │
  │    anthropic: {                                                                  │
  │      'claude-3-5-haiku': { input: 0.25, output: 1.25 },  // per 1M tokens      │
  │      'claude-3-5-sonnet': { input: 3.00, output: 15.00 },                       │
  │      'claude-3-opus': { input: 15.00, output: 75.00 },                          │
  │    },                                                                            │
  │    elevenlabs: {                                                                 │
  │      credit_cost_usd: 0.01,  // $0.01 per credit (approximate)                 │
  │      min_call_credits: 5,                                                        │
  │    }                                                                             │
  │  };                                                                              │
  │                                                                                  │
  │  async function trackCost(event: CostEvent): Promise<void> {                    │
  │    const cost_usd = calculateCost(event);                                       │
  │    const cost_eur = await convertToEur(cost_usd);                              │
  │                                                                                  │
  │    await db.insert(cost_events).values({                                        │
  │      id: nanoid(),                                                               │
  │      ...event,                                                                   │
  │      cost_usd,                                                                   │
  │      cost_eur,                                                                   │
  │      timestamp: new Date()                                                       │
  │    });                                                                           │
  │                                                                                  │
  │    // update running totals                                                      │
  │    await updateDailyTotal(event.provider, cost_usd);                           │
  │    if (event.user_id) await updateUserTotal(event.user_id, cost_usd);          │
  │    if (event.call_id) await updateCallTotal(event.call_id, cost_usd);          │
  │  }                                                                               │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  AGGREGATION TABLES                                                              │
  │  ──────────────────                                                              │
  │                                                                                  │
  │  cost_daily {                                                                    │
  │    date               DATE PRIMARY KEY                                          │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    other_usd          DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │  }                                                                               │
  │                                                                                  │
  │  cost_monthly {                                                                  │
  │    month              TEXT PRIMARY KEY   // "2024-12"                          │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    other_usd          DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │    unique_users       INTEGER DEFAULT 0                                         │
  │  }                                                                               │
  │                                                                                  │
  │  cost_per_user {                                                                 │
  │    user_id            TEXT PRIMARY KEY → users.id                              │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │    last_cost_at       DATETIME                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  cost_per_call {                                                                 │
  │    call_id            TEXT PRIMARY KEY → scheduled_calls.id                    │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    breakdown          TEXT              // JSON detail                          │
  │  }                                                                               │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  COST PER SUCCESSFUL CALL - EXAMPLE BREAKDOWN                                    │
  │  ────────────────────────────────────────────                                    │
  │                                                                                  │
  │  Scenario: User schedules call, 2 attempts needed                               │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  SCHEDULING PHASE                                                       │    │
  │  │  • haiku_parse_hours (if cache miss)     $0.0003                        │    │
  │  │                                                    Subtotal: $0.0003    │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  ATTEMPT 1 (no answer - 20 sec ring)                                    │    │
  │  │  • elevenlabs_call_no_answer             $0.05                          │    │
  │  │  • haiku_analyze (minimal transcript)    $0.0002                        │    │
  │  │                                                    Subtotal: $0.0502    │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  │                                                                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────┐    │
  │  │  ATTEMPT 2 (success - 45 sec conversation)                              │    │
  │  │  • elevenlabs_call_completed             $0.15                          │    │
  │  │  • haiku_analyze_transcript              $0.0005                        │    │
  │  │                                                    Subtotal: $0.1505    │    │
  │  └─────────────────────────────────────────────────────────────────────────┘    │
  │                                                                                  │
  │  ═══════════════════════════════════════════════════════════════════════════    │
  │  TOTAL COST FOR THIS SUCCESSFUL BOOKING:                         $0.201        │
  │  ═══════════════════════════════════════════════════════════════════════════    │
  │                                                                                  │
  │  At €5/month Patreon tier with 10 calls included:                              │
  │  • Cost per call: ~€0.18                                                        │
  │  • 10 calls = ~€1.80 cost                                                       │
  │  • Margin: €3.20 (64%)                                                          │
  │                                                                                  │
  │  At €10/month tier with 25 calls:                                               │
  │  • 25 calls = ~€4.50 cost                                                       │
  │  • Margin: €5.50 (55%)                                                          │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  BUDGET ALERTS & CONTROLS                                                        │
  │  ────────────────────────                                                        │
  │                                                                                  │
  │  budget_config {                                                                 │
  │    id                 TEXT PRIMARY KEY                                          │
  │    provider           TEXT NOT NULL                                             │
  │    daily_limit_usd    DECIMAL                                                   │
  │    monthly_limit_usd  DECIMAL                                                   │
  │    alert_threshold    DECIMAL   // e.g., 0.8 = alert at 80%                    │
  │    hard_stop          BOOLEAN   // stop service if limit hit?                  │
  │    alert_email        TEXT                                                       │
  │  }                                                                               │
  │                                                                                  │
  │  Example config:                                                                 │
  │  ┌────────────────┬─────────────┬──────────────┬───────────┬───────────┐       │
  │  │ provider       │ daily_limit │ monthly_limit│ threshold │ hard_stop │       │
  │  ├────────────────┼─────────────┼──────────────┼───────────┼───────────┤       │
  │  │ anthropic      │ $10         │ $200         │ 80%       │ no        │       │
  │  │ elevenlabs     │ $50         │ $1000        │ 80%       │ yes       │       │
  │  └────────────────┴─────────────┴──────────────┴───────────┴───────────┘       │
  │                                                                                  │
  │  CRON CHECK (every hour):                                                        │
  │  ────────────────────────                                                        │
  │  1. Sum today's costs per provider                                              │
  │  2. If > threshold × daily_limit → send alert                                  │
  │  3. If > daily_limit && hard_stop → disable new calls                          │
  │  4. Same for monthly                                                             │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  ADMIN DASHBOARD QUERIES                                                         │
  │  ───────────────────────                                                         │
  │                                                                                  │
  │  GET /api/admin/costs/summary                                                    │
  │  {                                                                               │
  │    "today": {                                                                    │
  │      "total_usd": 12.45,                                                        │
  │      "anthropic_usd": 1.23,                                                     │
  │      "elevenlabs_usd": 11.22,                                                   │
  │      "calls": 78,                                                                │
  │      "successful_calls": 45,                                                     │
  │      "cost_per_success": 0.276                                                  │
  │    },                                                                            │
  │    "this_month": {                                                               │
  │      "total_usd": 234.56,                                                       │
  │      "total_eur": 215.80,                                                       │
  │      "calls": 1456,                                                              │
  │      "successful_calls": 892,                                                    │
  │      "cost_per_success": 0.263,                                                 │
  │      "budget_remaining_usd": 765.44,                                            │
  │      "projected_monthly": 780.00                                                │
  │    },                                                                            │
  │    "by_operation": [                                                             │
  │      { "op": "elevenlabs_call_completed", "count": 892, "total": 178.40 },     │
  │      { "op": "elevenlabs_call_no_answer", "count": 423, "total": 21.15 },      │
  │      { "op": "haiku_analyze_transcript", "count": 1456, "total": 0.73 },       │
  │      { "op": "haiku_parse_hours", "count": 234, "total": 0.07 }                │
  │    ],                                                                            │
  │    "alerts": [                                                                   │
  │      { "type": "warning", "msg": "ElevenLabs at 73% of daily budget" }         │
  │    ]                                                                             │
  │  }                                                                               │
  │                                                                                  │
  │  GET /api/admin/costs/by-user?limit=20                                          │
  │  [                                                                               │
  │    { "user_id": "...", "email": "...", "total_usd": 12.34, "calls": 45 },      │
  │    ...                                                                           │
  │  ]                                                                               │
  │                                                                                  │
  │  GET /api/admin/costs/by-call/:call_id                                          │
  │  {                                                                               │
  │    "call_id": "...",                                                            │
  │    "total_usd": 0.201,                                                          │
  │    "events": [                                                                   │
  │      { "op": "haiku_parse_hours", "cost": 0.0003, "ts": "..." },               │
  │      { "op": "elevenlabs_call_no_answer", "cost": 0.05, "ts": "..." },         │
  │      { "op": "haiku_analyze", "cost": 0.0002, "ts": "..." },                   │
  │      { "op": "elevenlabs_call_completed", "cost": 0.15, "ts": "..." },         │
  │      { "op": "haiku_analyze", "cost": 0.0005, "ts": "..." }                    │
  │    ]                                                                             │
  │  }                                                                               │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 4: REJECTION HANDLING (unchanged)
  ═══════════════════════════════════════════════════════════════════════════════════

  [Same as before - REJECTED_AI, REJECTED_PRIVACY, REJECTED_OTHER flows]


  ═══════════════════════════════════════════════════════════════════════════════════
                           PHASE 5: COMPLETE DATABASE SCHEMA
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  EXISTING TABLES (from before)                                                   │
  │  ─────────────────────────────                                                   │
  │  • scheduled_calls                                                               │
  │  • therapist_blocklist                                                           │
  │  • therapist_cache                                                               │
  │  • privacy_incidents                                                             │
  │  • user_call_credits                                                             │
  └─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  NEW: COST TRACKING TABLES                                                       │
  │  ─────────────────────────                                                       │
  │                                                                                  │
  │  cost_events {                                                                   │
  │    id                 TEXT PRIMARY KEY                                          │
  │    timestamp          DATETIME NOT NULL                                         │
  │    user_id            TEXT             // nullable for system ops              │
  │    call_id            TEXT             // nullable                              │
  │    provider           TEXT NOT NULL    // anthropic, elevenlabs, etc           │
  │    operation          TEXT NOT NULL    // haiku_parse, call_completed, etc     │
  │    model              TEXT             // claude-3-5-haiku, etc                │
  │    input_tokens       INTEGER                                                    │
  │    output_tokens      INTEGER                                                    │
  │    duration_seconds   INTEGER                                                    │
  │    provider_credits   DECIMAL                                                    │
  │    cost_usd           DECIMAL NOT NULL                                          │
  │    cost_eur           DECIMAL                                                    │
  │    metadata           TEXT             // JSON                                  │
  │  }                                                                               │
  │                                                                                  │
  │  cost_daily {                                                                    │
  │    date               DATE PRIMARY KEY                                          │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    other_usd          DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │  }                                                                               │
  │                                                                                  │
  │  cost_monthly {                                                                  │
  │    month              TEXT PRIMARY KEY  // "2024-12"                           │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    other_usd          DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │    unique_users       INTEGER DEFAULT 0                                         │
  │  }                                                                               │
  │                                                                                  │
  │  cost_per_user {                                                                 │
  │    user_id            TEXT PRIMARY KEY                                          │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    total_eur          DECIMAL DEFAULT 0                                         │
  │    call_count         INTEGER DEFAULT 0                                         │
  │    success_count      INTEGER DEFAULT 0                                         │
  │    last_cost_at       DATETIME                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  cost_per_call {                                                                 │
  │    call_id            TEXT PRIMARY KEY                                          │
  │    anthropic_usd      DECIMAL DEFAULT 0                                         │
  │    elevenlabs_usd     DECIMAL DEFAULT 0                                         │
  │    total_usd          DECIMAL DEFAULT 0                                         │
  │    attempts           INTEGER DEFAULT 1                                         │
  │    breakdown          TEXT             // JSON                                  │
  │  }                                                                               │
  │                                                                                  │
  │  budget_config {                                                                 │
  │    id                 TEXT PRIMARY KEY                                          │
  │    provider           TEXT NOT NULL                                             │
  │    daily_limit_usd    DECIMAL                                                   │
  │    monthly_limit_usd  DECIMAL                                                   │
  │    alert_threshold    DECIMAL DEFAULT 0.8                                       │
  │    hard_stop          BOOLEAN DEFAULT false                                     │
  │    alert_email        TEXT                                                       │
  │    updated_at         DATETIME                                                   │
  │  }                                                                               │
  │                                                                                  │
  │  budget_alerts {                                                                 │
  │    id                 TEXT PRIMARY KEY                                          │
  │    provider           TEXT NOT NULL                                             │
  │    alert_type         TEXT NOT NULL    // daily_warning, daily_exceeded, etc   │
  │    threshold_pct      DECIMAL                                                    │
  │    current_spend      DECIMAL                                                    │
  │    limit_amount       DECIMAL                                                    │
  │    sent_at            DATETIME                                                   │
  │    acknowledged       BOOLEAN DEFAULT false                                     │
  │  }                                                                               │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           COST TRACKING INTEGRATION POINTS
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                  │
  │  // Every Anthropic call wraps with cost tracking                               │
  │                                                                                  │
  │  async function callHaiku(prompt: string, context: CostContext) {               │
  │    const start = Date.now();                                                    │
  │    const response = await anthropic.messages.create({                           │
  │      model: 'claude-3-5-haiku-20241022',                                        │
  │      messages: [{ role: 'user', content: prompt }],                             │
  │      max_tokens: 500                                                             │
  │    });                                                                           │
  │                                                                                  │
  │    await trackCost({                                                             │
  │      provider: 'anthropic',                                                      │
  │      operation: context.operation,                                               │
  │      model: 'claude-3-5-haiku',                                                 │
  │      input_tokens: response.usage.input_tokens,                                 │
  │      output_tokens: response.usage.output_tokens,                               │
  │      user_id: context.userId,                                                    │
  │      call_id: context.callId                                                    │
  │    });                                                                           │
  │                                                                                  │
  │    return response;                                                              │
  │  }                                                                               │
  │                                                                                  │
  │  // Webhook handler records ElevenLabs cost                                      │
  │                                                                                  │
  │  async function handleWebhook(payload: ElevenLabsWebhook) {                     │
  │    const call = await getCallByConvId(payload.conversation_id);                 │
  │                                                                                  │
  │    await trackCost({                                                             │
  │      provider: 'elevenlabs',                                                     │
  │      operation: `call_${payload.status}`,                                       │
  │      duration_seconds: payload.duration_seconds,                                │
  │      provider_credits: payload.cost?.total_credits,                             │
  │      user_id: call.user_id,                                                      │
  │      call_id: call.id                                                            │
  │    });                                                                           │
  │                                                                                  │
  │    // ... rest of webhook handling                                               │
  │  }                                                                               │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           VISUAL: STATE MACHINE (unchanged)
  ═══════════════════════════════════════════════════════════════════════════════════

  [Same state machine diagram as before]

                                ┌─────────────┐
                                │  SCHEDULED  │
                                └──────┬──────┘
                                       │
                            call time arrives
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  IN_PROGRESS    │
                              └────────┬────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
                      ▼                ▼                ▼
              ┌───────────┐    ┌───────────┐    ┌───────────┐
              │  PICKUP   │    │ NO_ANSWER │    │  FAILED   │
              │  💰+$0.15 │    │  💰+$0.05 │    │  💰+$0.02 │
              └─────┬─────┘    └─────┬─────┘    └───────────┘
                    │                │
                    ▼                ▼
              [outcomes]        [retry logic]
                    │
                    │  💰 +$0.0005 (transcript analysis)
                    ▼
              [final state]

> also for now we don't make appointments, we ask for open therapy spots 

● Good catch - the goal is to get on a waitlist or get a Erstgespräch/Probatorik slot, not book a full therapy appointment. Let me update the flow:

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                        KARL AUTO-CALL SYSTEM - FULL FLOW                         │
  │                            (with Cost Tracking)                                  │
  │                                                                                  │
  │  GOAL: Ask if therapist has open spots for Erstgespräch/Probatorik              │
  │        NOT booking appointments - just inquiry & waitlist                        │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           WHAT THE AI AGENT ACTUALLY ASKS
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  CALL SCRIPT OUTLINE                                                             │
  │  ───────────────────                                                             │
  │                                                                                  │
  │  Opening:                                                                        │
  │  "Guten Tag, mein Name ist KARL, ich rufe im Auftrag von [Patient Name] an,    │
  │   der/die einen Therapieplatz sucht."                                           │
  │                                                                                  │
  │  Main Question:                                                                  │
  │  "Haben Sie aktuell freie Kapazitäten für ein Erstgespräch oder                │
  │   probatorische Sitzungen? [Patient] ist bei der [Insurance] versichert        │
  │   und sucht [Verhaltenstherapie/etc.]"                                          │
  │                                                                                  │
  │  If asked about urgency:                                                         │
  │  "[Patient] wartet bereits seit [X Monaten] und hat bisher [Y] Absagen         │
  │   bekommen."                                                                     │
  │                                                                                  │
  │  If spots available:                                                             │
  │  "Wunderbar! Kann sich [Patient] bei Ihnen melden um einen Termin zu           │
  │   vereinbaren? Die Rückrufnummer ist [Number]."                                 │
  │                                                                                  │
  │  If waitlist:                                                                    │
  │  "Können Sie [Patient] auf Ihre Warteliste setzen? Wie lange ist die           │
  │   ungefähre Wartezeit?"                                                         │
  │                                                                                  │
  │  If no capacity:                                                                 │
  │  "Verstehe. Können Sie vielleicht eine andere Praxis empfehlen, die noch       │
  │   Kapazitäten hat?"                                                             │
  │                                                                                  │
  │  Closing:                                                                        │
  │  "Vielen Dank für Ihre Zeit! [Patient] wird sich melden / freut sich auf       │
  │   Ihren Rückruf / ist auf der Warteliste notiert."                             │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           POSSIBLE OUTCOMES (UPDATED)
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  OUTCOME CATEGORIES                                                              │
  │  ──────────────────                                                              │
  │                                                                                  │
  │  ✅ POSITIVE OUTCOMES                                                            │
  │  ────────────────────                                                            │
  │                                                                                  │
  │  SPOTS_AVAILABLE                                                                 │
  │    "Ja, wir haben gerade Kapazitäten"                                          │
  │    → User should call back to schedule Erstgespräch                            │
  │    → Store: therapist expects callback from patient                             │
  │    → Notify: "Praxis hat freie Plätze! Ruf an: [number]"                       │
  │                                                                                  │
  │  WAITLIST_ADDED                                                                  │
  │    "Ich setze Sie auf die Warteliste"                                          │
  │    → User is now on waitlist                                                    │
  │    → Store: waitlist position, estimated wait time                              │
  │    → Notify: "Du bist auf der Warteliste! Wartezeit ca. [X Wochen]"           │
  │                                                                                  │
  │  CALLBACK_PROMISED                                                               │
  │    "Wir melden uns bei Ihnen"                                                   │
  │    → Therapist will call patient back                                           │
  │    → Store: expected callback timeframe                                         │
  │    → Notify: "Praxis meldet sich bei dir [timeframe]"                          │
  │                                                                                  │
  │  ─────────────────────────────────────────────────────────────────────────────  │
  │                                                                                  │
  │  ⏳ NEUTRAL OUTCOMES                                                             │
  │  ───────────────────                                                             │
  │                                                                                  │
  │  NO_ANSWER                                                                       │
  │    Phone rang, no pickup / voicemail / busy                                     │
  │    → Schedule retry (different day/time)                                        │
  │    → Max 3 attempts                                                              │
  │                                                                                  │
  │  CALLBACK_REQUESTED                                                              │
  │    "Der Patient soll selbst anrufen"                                            │
  │    → Not hostile, just preference                                               │
  │    → Notify: "Praxis möchte dass du selbst anrufst"                            │
  │    → Enable self-call reminders                                                  │
  │                                                                                  │
  │  TRY_LATER                                                                       │
  │    "Rufen Sie nächste Woche nochmal an"                                        │
  │    → Schedule retry for suggested time                                          │
  │    → Notify: "Praxis sagt: nächste Woche nochmal probieren"                    │
  │                                                                                  │
  │  ─────────────────────────────────────────────────────────────────────────────  │
  │                                                                                  │
  │  ❌ NEGATIVE OUTCOMES                                                            │
  │  ────────────────────                                                            │
  │                                                                                  │
  │  NO_CAPACITY                                                                     │
  │    "Wir nehmen aktuell keine neuen Patienten auf"                              │
  │    "Warteliste ist voll / geschlossen"                                          │
  │    → Mark therapist as unavailable (temporary)                                  │
  │    → Notify: "Keine freien Plätze. Nächsten Therapeuten probieren?"            │
  │    → No retry                                                                    │
  │                                                                                  │
  │  WRONG_SPECIALTY                                                                 │
  │    "Wir machen kein [therapy type]"                                             │
  │    "Nur für Kinder/Erwachsene"                                                  │
  │    → Data issue - update therapist record                                       │
  │    → Notify: "Praxis bietet nicht [X] an"                                       │
  │    → Suggest alternative                                                         │
  │                                                                                  │
  │  INSURANCE_ISSUE                                                                 │
  │    "Wir nehmen keine [GKV/PKV/etc.]"                                           │
  │    → Data issue or filter missed                                                │
  │    → Notify: "Praxis nimmt deine Versicherung nicht"                           │
  │                                                                                  │
  │  ─────────────────────────────────────────────────────────────────────────────  │
  │                                                                                  │
  │  🚫 REJECTION OUTCOMES (blocklist triggers)                                      │
  │  ──────────────────────────────────────────                                      │
  │                                                                                  │
  │  REJECTED_AI                                                                     │
  │    "Keine automatisierten Anrufe"                                               │
  │    "Der Patient muss persönlich anrufen"                                        │
  │    → Soft blocklist (no auto-calls)                                             │
  │    → User must call themselves                                                   │
  │    → Enable self-call reminders                                                  │
  │                                                                                  │
  │  REJECTED_PRIVACY                                                                │
  │    "Woher haben Sie die Nummer?"                                                │
  │    "Das ist datenschutzrechtlich bedenklich"                                    │
  │    → Permanent blocklist                                                         │
  │    → Log incident                                                                │
  │    → User must call themselves                                                   │
  │                                                                                  │
  │  REJECTED_HOSTILE                                                                │
  │    Angry, threatening legal action, etc.                                        │
  │    → Permanent blocklist                                                         │
  │    → Alert admin                                                                 │
  │    → Incident report                                                             │
  │                                                                                  │
  │  ─────────────────────────────────────────────────────────────────────────────  │
  │                                                                                  │
  │  ❓ UNCLEAR                                                                       │
  │  ──────────                                                                      │
  │    Couldn't determine outcome from conversation                                 │
  │    → Flag for manual review                                                      │
  │    → Ask user to call themselves or retry                                       │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           HAIKU TRANSCRIPT ANALYSIS (UPDATED)
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  ANALYSIS PROMPT                                                                 │
  │  ───────────────                                                                 │
  │                                                                                  │
  │  "Analyze this phone call transcript where an AI assistant inquired about       │
  │   therapy availability on behalf of a patient.                                  │
  │                                                                                  │
  │   Classify the outcome:                                                          │
  │                                                                                  │
  │   POSITIVE:                                                                      │
  │   - SPOTS_AVAILABLE: Therapist has capacity, patient should call back          │
  │   - WAITLIST_ADDED: Patient was added to waitlist                               │
  │   - CALLBACK_PROMISED: Therapist will call patient back                         │
  │                                                                                  │
  │   NEUTRAL:                                                                       │
  │   - NO_ANSWER: No pickup, voicemail, busy signal                                │
  │   - CALLBACK_REQUESTED: Therapist wants patient to call personally (not hostile)│
  │   - TRY_LATER: Therapist suggested calling back at specific time                │
  │                                                                                  │
  │   NEGATIVE:                                                                      │
  │   - NO_CAPACITY: No spots, waitlist closed/full                                 │
  │   - WRONG_SPECIALTY: Therapist doesn't offer requested therapy type             │
  │   - INSURANCE_ISSUE: Therapist doesn't accept patient's insurance              │
  │                                                                                  │
  │   REJECTION:                                                                     │
  │   - REJECTED_AI: Explicitly rejected automated/AI calls                         │
  │   - REJECTED_PRIVACY: Privacy/data protection concerns                          │
  │   - REJECTED_HOSTILE: Angry, threatening                                        │
  │                                                                                  │
  │   OTHER:                                                                         │
  │   - UNCLEAR: Cannot determine outcome                                           │
  │                                                                                  │
  │   Extract and return JSON:                                                       │
  │   {                                                                              │
  │     outcome: string,                                                             │
  │     confidence: number (0-1),                                                    │
  │     waitlist_info: {                    // if WAITLIST_ADDED                    │
  │       position: number | null,                                                   │
  │       estimated_weeks: number | null                                            │
  │     } | null,                                                                    │
  │     callback_info: {                    // if CALLBACK_PROMISED/REQUESTED       │
  │       timeframe: string | null,         // 'diese Woche', 'in 2 Wochen'        │
  │       who_calls: 'therapist' | 'patient'                                        │
  │     } | null,                                                                    │
  │     retry_suggestion: string | null,    // if TRY_LATER                        │
  │     rejection_reason: string | null,    // verbatim if rejected                │
  │     recommendation: string | null,      // if they suggested another practice  │
  │     notes: string                       // any other relevant info             │
  │   }"                                                                             │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           ELEVENLABS AGENT CONFIGURATION
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  AGENT SYSTEM PROMPT                                                             │
  │  ───────────────────                                                             │
  │                                                                                  │
  │  "Du bist KARL, ein freundlicher Assistent der im Auftrag von Patienten        │
  │   bei Psychotherapiepraxen anruft um nach freien Therapieplätzen zu fragen.    │
  │                                                                                  │
  │   DEIN ZIEL:                                                                     │
  │   - Frage ob die Praxis aktuell Kapazitäten für neue Patienten hat             │
  │   - Frage nach Erstgespräch oder probatorischen Sitzungen                       │
  │   - Falls Warteliste: frage ob der Patient aufgenommen werden kann             │
  │   - Hinterlasse die Rückrufnummer des Patienten                                 │
  │                                                                                  │
  │   DU SOLLST NICHT:                                                               │
  │   - Termine direkt vereinbaren (der Patient macht das selbst)                   │
  │   - Medizinische Details besprechen                                             │
  │   - Druck ausüben wenn keine Kapazität                                          │
  │   - Streiten wenn die Praxis keine AI-Anrufe möchte                            │
  │                                                                                  │
  │   WENN DIE PRAXIS KEINE AI-ANRUFE MÖCHTE:                                       │
  │   - Bedanke dich höflich                                                        │
  │   - Sage dass der Patient selbst anrufen wird                                   │
  │   - Beende das Gespräch freundlich                                              │
  │                                                                                  │
  │   KONTEXT FÜR DIESEN ANRUF:                                                      │
  │   - Patient: {{patient_name}}                                                   │
  │   - Versicherung: {{patient_insurance}}                                         │
  │   - Gesuchte Therapieform: {{therapy_type}}                                     │
  │   - Rückrufnummer: {{callback_number}}                                          │
  │   - Bisherige Wartezeit: {{waiting_since}}                                      │
  │   - Anzahl bisheriger Absagen: {{rejection_count}}"                             │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           USER NOTIFICATION MESSAGES (UPDATED)
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  NOTIFICATION TEMPLATES                                                          │
  │  ──────────────────────                                                          │
  │                                                                                  │
  │  SPOTS_AVAILABLE:                                                                │
  │    "🎉 [Praxis] hat freie Plätze!                                               │
  │     Ruf jetzt an um einen Termin für ein Erstgespräch zu machen.               │
  │     📞 [phone]"                                                                  │
  │                                                                                  │
  │  WAITLIST_ADDED:                                                                 │
  │    "✅ Du bist auf der Warteliste bei [Praxis]!                                 │
  │     Geschätzte Wartezeit: [X Wochen/Monate]                                     │
  │     Die Praxis meldet sich wenn ein Platz frei wird."                          │
  │                                                                                  │
  │  CALLBACK_PROMISED:                                                              │
  │    "📞 [Praxis] meldet sich bei dir!                                            │
  │     Erwarteter Zeitraum: [timeframe]                                            │
  │     Halte dein Telefon bereit."                                                 │
  │                                                                                  │
  │  NO_ANSWER (retry scheduled):                                                    │
  │    "📵 [Praxis] nicht erreicht.                                                 │
  │     Nächster Versuch: [date/time]                                               │
  │     (Versuch [X] von 3)"                                                         │
  │                                                                                  │
  │  NO_ANSWER (max attempts):                                                       │
  │    "📵 [Praxis] nach 3 Versuchen nicht erreicht.                               │
  │     Möchtest du selbst anrufen oder zum nächsten Therapeuten?"                 │
  │                                                                                  │
  │  CALLBACK_REQUESTED:                                                             │
  │    "📋 [Praxis] möchte dass du persönlich anrufst.                             │
  │     Ich erinnere dich zur Sprechstunde!                                         │
  │     📞 [phone] | Sprechzeiten: [hours]"                                         │
  │                                                                                  │
  │  NO_CAPACITY:                                                                    │
  │    "😔 [Praxis] nimmt aktuell keine neuen Patienten auf.                       │
  │     Soll ich den nächsten Therapeuten auf deiner Liste probieren?"             │
  │                                                                                  │
  │  REJECTED_AI:                                                                    │
  │    "🤖 [Praxis] nimmt keine automatisierten Anrufe an.                         │
  │     Du musst selbst anrufen. Ich erinnere dich zur Sprechstunde!               │
  │     📞 [phone]"                                                                  │
  │                                                                                  │
  │  REJECTED_PRIVACY:                                                               │
  │    "🔒 [Praxis] hat Bedenken bezüglich des Anrufs.                             │
  │     Bitte ruf selbst an.                                                        │
  │     📞 [phone]"                                                                  │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           UPDATED DATABASE SCHEMA
  ═══════════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  scheduled_calls (UPDATED)                                                       │
  │  ─────────────────────────                                                       │
  │                                                                                  │
  │  id                  TEXT PRIMARY KEY                                           │
  │  user_id             TEXT NOT NULL → users.id                                   │
  │  therapist_id        TEXT NOT NULL                                              │
  │  therapist_name      TEXT                                                        │
  │  therapist_phone     TEXT NOT NULL                                              │
  │  e_id                TEXT                                                        │
  │  elevenlabs_conv_id  TEXT                                                        │
  │  scheduled_at        DATETIME NOT NULL                                          │
  │  attempt_number      INTEGER DEFAULT 1                                          │
  │  max_attempts        INTEGER DEFAULT 3                                          │
  │  status              TEXT                    // scheduled, in_progress,         │
  │                                              // completed, failed, cancelled    │
  │  outcome             TEXT                    // see outcome enum below          │
  │  transcript          TEXT                                                        │
  │  analysis            TEXT                    // JSON from Haiku                 │
  │                                                                                  │
  │  // INQUIRY RESULTS (not appointments!)                                         │
  │  has_capacity        BOOLEAN                 // does therapist have spots?     │
  │  waitlist_position   INTEGER                 // if added to waitlist           │
  │  waitlist_weeks      INTEGER                 // estimated wait time            │
  │  callback_expected   TEXT                    // 'therapist_calls' | 'patient_calls'│
  │  callback_timeframe  TEXT                    // 'diese Woche', etc             │
  │  retry_suggested_at  DATETIME                // if TRY_LATER                   │
  │                                                                                  │
  │  rejection_reason    TEXT                                                        │
  │  recommendation      TEXT                    // if they suggested another practice│
  │  notes               TEXT                                                        │
  │  created_at          DATETIME                                                    │
  │  updated_at          DATETIME                                                    │
  │  completed_at        DATETIME                                                    │
  │                                                                                  │
  │  outcome enum:                                                                   │
  │    // positive                                                                   │
  │    spots_available, waitlist_added, callback_promised,                          │
  │    // neutral                                                                    │
  │    no_answer, callback_requested, try_later,                                    │
  │    // negative                                                                   │
  │    no_capacity, wrong_specialty, insurance_issue,                               │
  │    // rejection                                                                  │
  │    rejected_ai, rejected_privacy, rejected_hostile,                             │
  │    // other                                                                      │
  │    unclear                                                                       │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │  contacts (UPDATED status values)                                                │
  │  ────────────────────────────────                                                │
  │                                                                                  │
  │  status enum:                                                                    │
  │    // manual flow                                                                │
  │    pending              // added to list, not contacted yet                     │
  │    contacted            // user contacted manually                              │
  │    replied              // therapist replied                                    │
  │    no_reply             // no response after X days                             │
  │                                                                                  │
  │    // auto-call flow                                                             │
  │    call_scheduled       // KARL will call                                       │
  │    call_in_progress     // currently calling                                    │
  │    has_capacity         // therapist has spots! user should call               │
  │    on_waitlist          // added to therapist's waitlist                       │
  │    awaiting_callback    // therapist will call back                            │
  │    self_call_required   // user must call themselves (AI rejected)             │
  │    no_capacity          // therapist has no spots                              │
  │    unreachable          // couldn't reach after max attempts                   │
  │                                                                                  │
  │    // final states                                                               │
  │    success              // got Erstgespräch scheduled (user confirmed)        │
  │    rejected             // user decided not to pursue                           │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════════════
                           FLOW DIAGRAM (SIMPLIFIED)
  ═══════════════════════════════════════════════════════════════════════════════════

  User clicks "Ruf für mich an"
              │
              ▼
      ┌───────────────┐
      │   SCHEDULED   │
      └───────┬───────┘
              │
       call executes
              │
              ▼
      ┌───────────────┐
      │  IN_PROGRESS  │
      └───────┬───────┘
              │
      ┌───────┴───────────────────────────────────────┐
      │               │               │               │
      ▼               ▼               ▼               ▼
  ┌────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
  │ PICKUP │   │ NO_ANSWER │   │ VOICEMAIL │   │  FAILED   │
  └───┬────┘   └─────┬─────┘   └─────┬─────┘   └───────────┘
      │              │               │
      │              └───────┬───────┘
      │                      │
      │               retry < 3?
      │              ┌───┴───┐
      │              ▼       ▼
      │           [YES]    [NO]
      │              │       │
      │              ▼       ▼
      │         SCHEDULE  UNREACHABLE
      │          RETRY    (notify user)
      │
      ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   CONVERSATION                           │
  └───────────────────────┬─────────────────────────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
  ┌─────────┐      ┌────────────┐      ┌────────────┐
  │POSITIVE │      │  NEUTRAL   │      │ NEGATIVE/  │
  │         │      │            │      │ REJECTION  │
  └────┬────┘      └─────┬──────┘      └─────┬──────┘
       │                 │                   │
       ▼                 ▼                   ▼
  ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
  │SPOTS_AVAILABLE│ │CALLBACK_REQ │  │ NO_CAPACITY  │
  │→ user calls   │ │→ self-call  │  │→ next ther.  │
  │              │ │  reminders  │  │              │
  │WAITLIST_ADDED │ │             │  │ REJECTED_*   │
  │→ wait        │ │TRY_LATER    │  │→ blocklist   │
  │              │ │→ schedule   │  │→ self-call   │
  │CALLBACK_PROM │ │  retry      │  │              │
  │→ wait        │ │             │  │              │
  └──────────────┘ └──────────────┘  └──────────────┘

  Key changes:
  - Goal is inquiry, not booking - we ask about availability, not schedule appointments
  - Patient calls back for actual Erstgespräch scheduling
  - Outcomes updated - SPOTS_AVAILABLE, WAITLIST_ADDED, CALLBACK_PROMISED instead of appointment_booked
  - Contact status flow reflects inquiry-based approach
  - Agent script focuses on asking about capacity, not making appointments

