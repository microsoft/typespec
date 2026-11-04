# Pre-emission simplification: Task03 checklist

Tracking [issue #12454](https://github.com/microsoft/typespec/issues/12454) on
`feature/pre-emission-task03-continuation`.

**Implementation handoff:** follow the
[scope review and prioritization](./pre-emission-task03-scope-review.md) for the next
milestone: G1/raw-writer acceptance first, then reductions selected by demonstrated
benefit. The inventory below retains the full accepted scope, including deferred
work; its open rows are not all prerequisites for that narrower milestone. No
original regression expectation or safety gate is waived.

## Status and how to read this checklist

**39 work items: 4 bounded producer items complete, 32 implementation/integration
items open, and 3 final gates open — 35 open in total.** These are work items,
not NUnit case counts or a completion percentage. A passing retention test does
not close a missing shortening positive. Producer support does not establish
raw-writer acceptance; that is tracked separately in section G.

As of **2026-11-04**:

- **Previous published code checkpoint:**
  [`ba019d2820651fb577b9f07df71d83bf2ef5aaa1`](https://github.com/live1206/typespec/commit/ba019d2820651fb577b9f07df71d83bf2ef5aaa1).
- **This continuation checkpoint:** additional block-lambda contexts, owning
  receivers, the original private-instance generic producer, and independent
  field/body fallback rendering, plus the selected original raw outcome below.
- **Selected original raw outcome:** both original `typeof` host cases pass
  through complete physical inputs and one standard writer. The ordinary
  seed/operand shorten; the captured case shortens the seed while preserving
  the operand and captured text. Shared-IR edge isolation, sticky used-permission
  fallback, and physical-input/policy guards pass. Three unpublished helper-only
  positives were superseded by these faithful outcomes, not used to waive
  original anchors. The physical-input fallback control first proves a valid
  shortened commit, then verifies rejection after input mutation.
- **Fresh checkpoint validation:** unfiltered core **4,078/4,078** and client
  **2,696/2,696**, with zero failures/skips. Formatting/Cop passed; all 41 C# file
  hashes remained unchanged through validation. Remote CI is not established by
  these local results; later adopted scope requires fresh gates.
- **Independent review:** exhaustive medium read-only review of the continuation
  delta found a documentation-formatter alias escape. Native binding/runtime
  reproduced the defect before the minimal formatting-purity fix; the unchanged
  negative/native-positive pair and original safeguards passed a 16-case gate.
  Independent follow-up review found the fix adequate with no concrete remaining
  in-scope defect; the fresh broad results above include that fix.
- Checked rows below describe only their stated bounded producer scope. The 35
  open items remain open. Original PR #12462 and its branch/thread remain
  unchanged; no default activation, performance, SDK adoption, or Task03
  completion is claimed.

The scope remains the accepted issue/POC families. Preserve their original
positive and retention anchors, including actual instance calls, local delegates,
and omitted caller-expression arguments. Preparation uses occurrence-specific
facts before one standard writer traversal. Selection, contextual typing,
observation absence, source policy, and editing permission remain distinct.
Canonical type/IR identity, callback-once behavior, independent field/literal
positives, and sticky observed invalidation must be preserved. No production
binder, generated-body parsing/compilation, fabricated method symbol, replay, or
second preparation lifecycle is permitted.

## A — Written-input and shared environment closure (3)

- [ ] **A1** Close remaining older-call whole-written-input dependencies. Audit
  every emitted header, signature, documentation, suppression, and body input
  that can change lookup or observations. Preserve native formatting purity,
  file-warning confinement, and independent field/literal positives.
- [ ] **A2** Complete non-dispatch lookup/currentness audits across adopted maps,
  factories, and retained declaration inputs. Preparation and currentness must
  not execute user equality, getters, or callbacks. Unsupported dispatch retains
  locally; restoration must not revive an observed stale fact.
- [ ] **A3** Account for remaining physical writer-owned roots and opaque
  boundaries: fields, attributes/defaults/constraints, properties, constructor
  initializers, nested/local declarations, statements, and expression edges.
  Correspondence must not force lazy carriers.

## B — Actual argument and contextual-conversion evidence (4)

- [ ] **B1** Prove the actually emitted unqualified `Array.Empty<T>()` lookup for
  empty explicit-array initializers, or retain while keeping that positive open.
  Validate raw syntax, shadowing/imports, selected calls, and diagnostics;
  preserve nonempty, sized, and homogeneous-array anchors.
- [x] **B2 — bounded producer complete:** explicit closed nongeneric metadata
  type arguments on metadata/loaded-source generic methods and contextual
  delegates, using actual native construction/substitution. The 266-case gate
  preserved native partial contracts, caller-info correspondence, no-inference
  controls, and retained-argument invalidation. This does not close generated
  generics, general constraints/inference, or raw-consumer acceptance.
- [ ] **B3** Complete required bounded target/contextual standard conversions.
  Require actual emitted target and return/element authority plus language
  gates; wrong hints, user-defined/dynamic/error conversions remain unavailable
  unless separately proved.
- [ ] **B4** Compose defaults, arrays, constructions, and selected returns with
  source/generated/delegate parents. Preserve formal/evaluation/omitted/named
  maps and independent ancestor captures; isolated type facts are insufficient.

## C — Loaded-source, lexical delegates and value declarations (4)

- [ ] **C1** Complete required loaded-source instance, inheritance, and closed
  generic cases. Require actual receivers, complete bounded hierarchies,
  original trees/assembly/QName/partial-attribute correspondence, and retained
  source-error/file-local/competition controls. An 81-case subset is validated.
- [ ] **C2** Support required lexical local delegates and plain/explicit Invoke
  using actual emitted declaration identity and native Invoke contracts.
  Validate lexical shadowing, foreign/shared declarations, and sticky changes;
  retained signatures and variable type hints are not authority.
- [ ] **C3** Complete required delegate field/property/owner/control-flow forms.
  Require actual written contracts and exact lexical edges; preserve existing
  static-field and emitted-parameter Invoke/direct-invocation positives.
- [ ] **C4** Complete remaining canonical source value declarations used by
  accepted calls. Require actual field/property/declaration ownership and emitted
  types, not asserted type/scoped hints. Late changes and opaque boundaries must
  retain locally.

## D — Generated/custom declaration families (5)

- [ ] **D1 — bounded slice validated; broader work open:** actual generated
  instance calls through emitted parameters, with named competitors, empty type
  arguments, syntax/map/currentness controls. The strict empty-map/signature
  envelope is not broader member/custom/factory adoption. Complete actual
  filtered/customized inventories, receiver/formal correspondence, and distinct
  selection/absence behavior remain required.
- [ ] **D2 — original producer validated locally; broader scope open:** the
  unchanged kind-7 private-instance `object Generic<T>() => typeof(T)` with
  `M(object value)` and unused `Exception seed = default` now passes alongside
  narrow public-static substitution cases. Base/candidate comparison preserves
  seven missing-positive failures on the base and five passing controls; the
  candidate gate passes 95/95. Private access requires actual same-owner proof;
  finite block ownership supplies no parameter/local type evidence. Native-valid
  name collisions remain conservatively unavailable. Raw acceptance and full
  generic/group/access/freshness scope remain open; no fabricated method symbol.
- [ ] **D3** Complete generated explicit/contextual constructors and required
  initializer composition. Require actual emitted groups/targets, argument and
  observer maps, and customization competition; constructor intent is not proof.
- [ ] **D4** Complete registered source/custom partial composition. Include all
  emitted/loaded parts, compatibility/filtering, and observer correspondence;
  missing, competing, or implementation-only attributes cannot imply absence.
- [ ] **D5** Support required real factory/getter contracts, including SCM and
  customization patterns. Prove bounded dispatch purity/currentness; the strict
  default-getter subset must not be presented as complete adoption.

## E — Extensions, receivers and implicit calls (6)

- [ ] **E1** Complete required reduced-extension generic/substitution/receiver
  combinations. Preserve actual native reduction, justified receiver inference,
  original formal-zero mapping, complete competitors, independent visible
  witnesses, and existing 59-case native/source freshness anchors.
- [ ] **E2 — owning-receiver slice validated locally; conditional scope open:**
  actual explicit-this/implicit-owner identity and complete named groups pass
  original and scope/currentness controls. Native scalar formal evidence is
  confined to the new family. Preserve source-policy guards and inactive-source
  retention; broader conditional correspondence remains Task11 work.
- [ ] **E3 — bounded slice validated; broader work open:** native metadata-base
  constructor initializers use the actual cached emitted base and bounded owned
  body/signature/header/suppression proofs. Preserve opaque retention and
  mutation controls. This/source/generated/protected/multiowner and richer-body
  forms still require actual target/group/formal/observer evidence on the
  initializer edge, within the same lifetime and writer pass.
- [ ] **E4** Complete required implicit object-initializer operations. Require
  actual selected construction/member-setter contracts and exact edges;
  distinguish anonymous, object, and contextual construction.
- [ ] **E5** Complete required collection-initializer Add operations. Require
  bounded actual Add lookup/contracts and key/value/element edges. Unknown
  implicit operations must not erase unrelated body/field/literal positives.
- [ ] **E6** Complete supported extension import envelopes. Prove written
  imports/globals/namespace ancestry, conservative competitors versus independent
  visible witnesses, option-only using behavior, deep mutation, custom formatting,
  and instance precedence.

## F — Closures, lexical scopes and implicit observations (7)

- [x] **F1 — bounded producer complete:** owned empty-parameter block-lambda
  Return/If/IfElse/While/DoWhile applicability from actual metadata delegates.
  The 136-case gate includes missing/wrong returns, conditions, callbacks,
  captures, and mutation. No general CFG/local declarations or raw-edit claim.
- [x] **F2 — bounded producer complete:** nonempty expression-lambda parameters
  under a sole qualified public static metadata parent in an audited
  parameterless single-method owner. The 250-case gate covers native formal to
  declaration identity, named/reordered maps, shared IR under distinct contexts,
  foreign intent, candidate/ownership negatives, and sticky changes. Broader
  parents and raw permissions remain open.
- [x] **F3 — bounded producer complete:** the same nonempty-lambda context under
  actual loaded qualified source parents, reusing source lookup/correspondence.
  The 255-case gate includes original-tree/native partial and implementation-only
  caller-info controls. Broader parents and raw acceptance remain open.
- [ ] **F4 — block-lambda slice validated; broader work open:** owning
  method parameters/outer captures, nonempty block lambdas, nesting, and required
  contextual parents. Base/candidate comparisons preserve missing positives;
  observer-specific assertions retain leaf captures independently of parent
  overrides. Require pre-child context without provisional winners/currentness
  cycles, audited names/scopes, and foreign/shared-context isolation.
- [ ] **F5** Complete required local functions and local declaration scopes.
  Require actual emitted parameter/default/attribute semantics, lexical identity,
  shadowing, containment, and capture maps—not provider intent. D2's finite unused
  local profile is not a general local binder.
- [ ] **F6 — bounded synchronous-resource slice validated; broader work open:**
  the 310-case gate proves native sealed-IDisposable resource-text absence in
  both using forms without fabricating a factory winner; preserves CAE,
  unknown-layout, mutation/disposal, enclosing-lambda, and existing collection
  controls. Async/pattern disposal, broader enumeration/resource behavior, and
  raw acceptance remain open. Required overloaded-resource positives need actual
  selection or complete nonobserver groups with a witness, not name allowlists.
- [ ] **F7** Complete required handler-potential and interpolation/conversion
  observation families. Require actual hole/conversion/handler capture edges and
  authoritative conversions; preserve runtime captures and independent positives.

## G — Source policy and actual raw-writer acceptance (7)

- [ ] **G1 — selected original slice validated; broader item open:**
  occurrence-owned permission now connects the original local declaration and
  `typeof` sites to actual body-only admission, root snapshots, attachment,
  standard-writer cursor consumption, and used-permission commit validation.
  The unchanged ordinary/captured original host outcomes, shared-IR isolation,
  sticky used-body fallback, and physical-input/policy guards pass. No dummy
  fields, global type/IR permissions, or weakened input gates. Remaining accepted
  families and final validation still need their own evidence.
- [ ] **G2** Preserve original lexical/parser safeguards: value/type shadowing,
  lexical type parameters, nameof/dynamic, contextual identifiers/terminal
  tokens, and backing-field `field`. Retain or shorten exactly as accepted
  anchors require.
- [ ] **G3** Provide raw-writer counterparts for every accepted matrix row. The
  original inventory has 15 rows across 44 frozen source files; static inventory
  is not acceptance. Preserve actual instance `Pass`, local delegates, and two
  omitted caller-expression fixtures. Require permission and raw output before
  legacy processing; facts or legacy reduction cannot close this item.
- [ ] **G4** Complete original descriptors, trivia/comments/directives, and
  diagnostic visibility. Structured tokens need audited fixed policy;
  raw/custom/source-bearing fragments need original provenance or retention.
  Boundary restoration cannot justify internal trivia/directive loss.
- [ ] **G5** Complete alternate configurations, inactive source, and original
  source competition. Preserve configuration-dependent captures/retention and
  diagnostic policy; no unsupported global-using or Task11 conditional expansion.
- [ ] **G6** Complete caller-line/layout/newline fidelity. Verify original
  relevant layout, LF/CRLF, multiline lambda/interpolation capture, and caller
  line constants against actual one-write output and compiler/runtime.
- [ ] **G7 — rendering mechanics validated; lifecycle scope open:**
  captured numeric spelling alternatives now support independent field/body
  choices from one writer traversal. Mechanics, actual field transfer, all four
  output choices, no replay, and existing field independence are validated.
  Default hidden unused-import diagnostics are explicitly controlled; configured
  diagnostic policies are not broadened. The selected original slice additionally
  passes actual used-permission registration, shared-node isolation, deep sticky
  fallback, and changed physical-input rejection. Disposal/configuration and
  freshness coverage across all further adopted permissions remain open. Preserve
  default-off/custom-writer/rewriter/independent field/literal behavior.

## V — Final gates (3)

- [ ] **V1** Run fresh required broad/unfiltered suites and change-specific
  formatting/Cop checks at stable scope. Record actual results/hashes and
  outstanding CI. This bounded checkpoint passes fresh unfiltered core/client
  suites (4,078/2,696), formatting/Cop, and all 41 source-hash checks. This does
  not close V1 for later adopted Task03 scope; remote CI remains unverified.
- [ ] **V2** Obtain a frozen, exhaustive independent medium read-only review of
  the full relevant change set and behavior combinations. Verify actual route,
  thinking, and tools; independently reproduce/assess findings and batch fixes,
  revalidation, and review without weakening anchors. Focused producer/fallback
  reviews do not close this gate. The full continuation review found a verified
  documentation-formatter binding escape; the bounded fix and its unchanged
  negative/native-positive regressions pass focused validation. Independent
  follow-up review found no concrete remaining in-scope defect; fresh broad gates
  pass for this checkpoint. This does not substitute for review of later adopted
  Task03 scope.
- [ ] **V3** Reconcile each accepted row with producer **and raw-writer** evidence
  plus retained controls; disclose unresolved positives before assessing Task03
  completion/adoption. Publish validated WIP only to this continuation branch.
  Original PR/comments/thread changes require their separate approval gates.
