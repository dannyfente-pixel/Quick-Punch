# Firebase Security Specification: Quick Punch

## Phase 0: Data Invariants & Access Controls
The Quick Punch application operates as a touch-friendly physical kiosk terminal. Individual employees do not register personal login accounts, but instead record shifts by writing to a shared collection. Security is strictly enforced by server-side constraints and value-checking heuristics:

1. **Shift Structure Integrity**: Every shift punch must contain a non-empty `employee_name` (no longer than 100 characters), a valid ISO `clock_in_time`, a valid `date`, and a unique alphanumeric `id`.
2. **First-Write Immutability**: Critical fields like `clock_in_time`, `date`, and `employee_name` are set once on clock-in and locked permanently. They cannot be modified relative to their initial values.
3. **One-Way Terminal State Transition**: A punch starts with `clock_out_time: null` and `total_hours: null`. It can only transition once to a closed state containing safe ISO values and a double-precision float for `total_hours`.
4. **Terminal Locking**: Once `clock_out_time` is clocked and saved, the record becomes final and immutable to prevent retrospective fraud or timecard tampering.
5. **Size and ID Protection**: Any `id` must be a high-entropy string restricted to matching `^[a-zA-Z0-9_\-]+$`, and the total length of strings is bounded to thwart resource exhaustion.

---

## The "Dirty Dozen" Payloads (Exploit Scenarios)
These malicious payloads represent attempts by clients to hijack or cheat the system. The security rules will reject these operations synchronously:

1. **The Ghost Field Attack**: Inserting an unvalidated property `isAdmin: true` to bypass administrative validation bounds.
2. **Name Hijack Injection**: A payload containing a giant 2MB string for employee name to incur massive bandwidth and billing charges.
3. **Impersonated Clock-out Rewriting**: Attempting to alter a previously closed punch card to change `employee_name` or `total_hours`.
4. **Retroactive Shift Backdating**: Creating a punch with a manual `clock_in_time` belonging to last week to claim false overtime.
5. **Status Reversion Attack**: Attempting to re-set a closed shift back to `clock_out_time: null` to restart billing calculations.
6. **Double Clock-Out Override**: Overwriting an already clocked out hours total with another calculation.
7. **Negative Shift Fraud**: Providing a negative number `-12.5` for `total_hours` to crash accounting analytics.
8. **Malicious ID Injection**: Creating a document where the document ID is `../../../sensitive_system_endpoints` to trigger path traversal bypass.
9. **Zero-In Clock Out**: Trying to click Clock-Out on a record where the punch out time is earlier than the punch in time.
10. **Null Clock-In Bypass**: Creating a punch record with a null or missing `clock_in_time`.
11. **Spoofed Administrative Wipe**: Attempting to delete or clear all records from an unauthorized client context without authorization.
12. **Altering Creation Date**: Overwriting the `date` of a punch to move a shift to a different pay cycle.

---

## Security Verification and Rule Set Tests
All operations are governed by logical boolean guards validating data structures exactly as outlined.
These elements are coded in `firestore.rules` and verified via linter to safeguard absolute resource integrity.
