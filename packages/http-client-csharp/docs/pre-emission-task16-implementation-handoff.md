# Task16 handoff: bounded branch-local static invocations

Contract: [Task16](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550382).
Dependencies: Tasks03 and 13. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare accepted ordinary block-method static calls whose complete active method
and occurrence are invariant, and whose WHOLE call is disabled in inactive parses.
This is a distinct bounded profile, not a way to bypass Task13's retained guards.

No general inactive-branch permission, blanket source-flag clearing, closure/local-function expansion or forced positive through a directive-bearing receiver veto.

## Minimal mechanism

Capture actual active/inactive whole-call correspondence, owner/occurrence identity,
visibility, single-line/layout and non-overlap facts from structured source/directive
plans before emission. Do not discover spans or ownership by parsing written output.

Preserve original closure, outer-argument, source, lookup, token and directive facts.
An active match does not imply the inactive original had an editable counterpart;
whole-call disablement is different from a partially directive-bearing receiver.

## First checkpoint

Start with an actual BranchStaticReceiverTrial positive: scenario 1's nested
using/open/write calls, 2's returned fallback call, or 16's directly assigned call.
Pair scenario 0's directive-bearing receiver retention. Use the actual block method
and whole disabled call, not an expression-bodied/local-function substitute.

Then keep scenarios 3/4 Action-to-Func/CAE and inactive-only closure controls,
including forced-unsafe edits showing changed synthesized strings despite zero
active Utility calls. Their retention is not the first shortening positive.

Assert the prepared profile, raw receiver choice, inactive text and exact native
binding/diagnostics/source under every relevant parse. Do not recover a positive
by resetting an inactive/directive flag.

## Remaining coverage and completion

Anchors: StructuralBranchStaticReceiverTests. Keep the original kind 3/4 false
trials and all declared positive/retention controls visible; a few passing active
branches do not close the profile.

Do not inherit general conditional property expansion from this work. The exact
accepted reduced-extension receiver capture pair belongs to Task13. Complete the
bounded branch-local call inventory and existing safeguards without adding a
general conditional source-equivalence or inactive-source engine.
