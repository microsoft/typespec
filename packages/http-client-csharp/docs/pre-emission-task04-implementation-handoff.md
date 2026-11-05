# Task04 implementation handoff: ordinary type spellings

Tracking [issue #12454](https://github.com/microsoft/typespec/issues/12454), specifically
[Task04](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541243),
on `feature/pre-emission-task04` in the fork.

## Authority, baseline and objective

Task03 is merged. Start from `feature/pre-emission-field-types` at
[`674e6ca`](https://github.com/live1206/typespec/commit/674e6ca75851acab5e4289e4034878664b102264),
which contains Tasks01-03. Its production source matches the reviewed Task03
checkpoint `ac0fc0746`. Do not restart Task03 or use upstream `main` as though it
already contains this preparation core.

**Deliver useful ordinary type-slot reductions through one shared preparation
mechanism. Do not complete an increasingly general proof system first.**

This handoff stages implementation; it does not silently narrow Task04's accepted
positives. The linked Task04 contract and revised
[Task19 architecture](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543557177)
remain authoritative. The older issue-body compiler-owner/hybrid design is not an
alternative implementation. No production implementation is included in this
handoff commit.

## Scope

| In Task04                              | Boundary                                                                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary declaration/type-only slots   | Fields, properties, events, returns, parameters, locals, delegates, bases/interfaces and constraints; the certified operator/conversion, tuple/ref/scoped/fixed/function-pointer, foreach/as/pattern, primary-constructor, explicit-interface and lambda-return roles. |
| Ordinary type-only expression operands | Creation, arrays, `typeof`, `default(T)`, `sizeof`, stack allocation, catch and protected casts. Change the type spelling, not surrounding conversion/default/creation/grouping syntax.                                                                                |
| Type shape and qualified prefixes      | Nullable/array/generic/supported nested forms; certified simple/partial/alias/global-prefix choices; terminal escaping, arity/owners and retained arguments; independently eligible children.                                                                          |
| Relevant safety                        | Actual role/scope/target and construction facts, source observation, trivia/directives/layout, diagnostics, input/currentness and occurrence ownership for the adopted slots.                                                                                          |

Do not implement these other families as incidental Task04 work:

- Static receiver shortening (Tasks06/13/16), `this` removal (Task07), or
  parentheses removal (Tasks05/12).
- Optional-argument/default omission (Task08), attribute-name qualification/suffix
  changes (Task09), the specifically retained SDK-cast family (Task10), or XML
  documentation reference decisions (Tasks17-18). An accepted ordinary type-only
  operand inside an attribute is not the attribute-name family.
- Conditional correspondence (Task11 and its consumers), qualified `nameof`
  expansion, generic inference, a general overload resolver/binder or CFG engine.
- A new compiler/MSBuild host, broader input admission, arbitrary plugin support,
  default activation, SDK regeneration/adoption, a performance campaign, or final
  `Simplifier` removal/cross-family replacement (Task19 and separately authorized work).

Retain unsupported generic containing-target graphs, unbound/error graphs,
ambiguous bare patterns, unprotected casts, and aliases that erase retained
arguments as required by the original anchors. Do not interpret that boundary as
excluding every lexical generic owner: original cases require arity-sensitive
lookup inside generic classes/methods and correct type-parameter ownership.

## Checkpoint 0: finite acceptance and representation map

Before production edits, make one map of the Task04-owned acceptance surface.
Use the [Task03 acceptance map](./pre-emission-task03-acceptance-map.md),
[follow-up ledger](./pre-emission-task03-follow-up-ledger.md) and the frozen
[original tests](https://github.com/live1206/typespec/tree/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test).
The required role/prefix/qualified-context/trivia/integration anchors remain
visible throughout implementation; all 44 files are not separate Task04 gates.

For each accepted case, record:

- Original fixture and unchanged positive/retention expectation.
- Concrete type slot, standard writer entry point and provider/IR representation.
- Lexical scope, target/construction and source-observation dependencies.
- Existing support, a missing bounded fact, or a representation decision needed.
- Prepared-decision, raw-output, native binding/diagnostic/runtime evidence and
  the implementation checkpoint responsible for it.

**Inventory correction:** `UnobservedCallSourceAllowsNamespaceReduction` has cases
**0 through 11**, not only the earlier ledger label 0-8. Cases 9-11 are explicit
caller-expression overrides on an ordinary call, constructor and reduced extension.
They are already accepted type-spelling cases, not a new feature request.

Preserve whole mixed fixtures, actual private instance helpers, original local
delegates, omitted caller-expression arguments and source-part relationships.
Do not replace them with easier static/parameter-delegate/metadata fixtures or
move helpers to a different source authority merely to bypass a missing proof.

Some advanced role fixtures use raw/interpolated writer syntax rather than an
existing structured emission node. Existing IR supports several advanced cases,
including operators, explicit interfaces and stack allocation, but that is not
proof all listed roles have a trusted type-slot entry point. For example,
`TypeProviderWriter.WriteInterfaceContent` currently emits an empty interface body.
Do not build a complete interface or language-feature emitter incidentally to
change a type spelling. Identify a minimal bounded role/emission contract before
coding such a case; if significant infrastructure is needed, request a concrete
scope/cost decision. Accepted positives stay pending unless explicitly reassigned.

## Shared mechanism: owned slots, prepared choices, one writer

Start with one small shared type-slot/spelling-plan model, not planners and caches
for each syntax role. Suggested responsibilities, not mandatory API names:

1. **Owned slot identity:** reuse the existing generation/occurrence identity,
   with an explicit role and type-child path. A shared `CSharpType`, intended
   signature, arbitrary formatted hole or caller-supplied `isTypeOnly` flag is
   not editing authority.
2. **Preparation:** capture the actual role/scope/target, needed construction
   facts, qualified-prefix choice, child plans and affecting source/input facts.
   Reuse symbol catalogs, observations, snapshots, permission/use receipts and
   the existing preparation lifetime.
3. **Consumption:** the standard writer consumes the prepared choice at that
   exact slot. No semantic lookup, generated-body parsing/compilation or
   post-write decision owner. Reuse numeric spelling alternatives and sticky
   commit fallback without callback replay.

Implementation boundaries:

- `CodeWriter.AppendType` is also used for documentation, attributes and receiver
  formatting. Do not add a global shortening switch or infer the role from its
  `isDeclaration` boolean. Enter a role context only around the actual type
  emission, not an entire method/parameter including its attributes and docs.
- Use the pure type-only lookup in `PreparedFieldImportLookup` as a starting
  point, not its field-specific adapter: signature-import collection can evaluate
  formatting. Existing lookup is primarily arity-zero and rejects several
  alias/global/static-using environments. Bounded arity/alias extensions require
  explicit facts, not simply relaxing those guards.
- Keep base-list, constraint, member-body, method/local-function type-parameter
  and declaration lookup scopes distinct. Account for final emitted identifiers,
  partials and unreferenced accessible competitors, not just referenced types.
- Preserve the writer's terminal escaping, argument syntax, nullable/array
  handling and new-instance/generic-depth behavior. A prefix plan is not license
  to reconstruct the whole type from a semantic symbol.
- A retained outer prefix does not automatically veto independently eligible
  children. A parent role/source-policy veto does propagate to children; warmed
  lookup results must not bypass it. Keep child permissions occurrence-owned.
- An alias must be certified and visible in the actual written physical file.
  An alias in another partial file is not visible here. Preserve terminal
  arguments, do not introduce imports/aliases just to create a reduction, and
  specify a bounded header contract if an accepted alias case needs one.
- Extend the existing shared lifetime when a new slot becomes a candidate even
  without an eligible field. Do not add a dummy field, second session, hard-coded
  type-name whitelist or another unused-local template copied from Task03.

## Checkpoint 1: actual Foo local-type consumer

The first candidate is the measured Foo ClientModel input: one output file with
**four observed qualified `PipelineMessage` local-type opportunities** and 38
input roots. Four is an opportunity count, not four established permissions.
The normal/shadow measurements and limitations are in the Task03 acceptance map.

1. Reproduce the baseline and classify each actual declaration/using-declaration
   or scope slot. Reuse the valid Foo raw-writer and input/reference-map fixtures;
   do not substitute a one-owner toy fixture.
2. Establish necessary SCM symbol references in the test inputs. Existing
   controlled fixtures may only reference `object`; do not manufacture production
   references or broaden public consumer admission to make the test pass.
3. Prepare the ordinary admitted local-type choices using all actual roots,
   source competitors and existing lifetime. No hard-coded `PipelineMessage`
   permission, dependency on an unrelated eligible field, or custom-writer bypass.
4. Shorten an unobserved declaration annotation without requiring general
   `CreateMessage`/disposal call selection. Prove only the source region relevant
   to that annotation. If a shared barrier is too broad, refine the role/region
   evidence; do not globally clear implicit-operation/capture flags. Enclosing
   caller-expression/lambda captures, unknown affecting regions, layout and
   configuration constraints still apply.
5. Check native binding and relevant diagnostics, normal output, relevant
   unreferenced-name/source shadowing, and unchanged independent field choices.
   Cover actual admission/use/commit and same-pass fallback, including a case
   without an eligible field. Direct fixture predicates do not establish the
   full asynchronous `CSharpGen` path when that adoption is claimed.
6. Record actual eligible/enabled raw slots and reasons for retention. At least
   one genuine raw reduction must be demonstrated before expanding another
   family; retention alone is not the vertical slice. Do not claim every observed
   opportunity is eligible without its role/source evidence.

Preflight admission early. If enabling this consumer requires proving arbitrary
opaque bodies, a broad callback-purity framework or a host redesign, stop that
expansion and report the smallest missing emission contract and bounded
alternatives. Do not spend weeks expanding shared proofs before obtaining output.

## Later checkpoints within Task04

After reviewing the first real slice, extend the same mechanism:

1. **Common declarations:** properties, returns, parameters, delegates, bases,
   interfaces and constraints; preserve existing field behavior. Include the
   supported operator/explicit-interface positions and their distinct scopes.
2. **Shapes and prefixes:** nullable/arrays/generic/nested forms, arity,
   type-parameter identity, escaped terminals, argument retention, partial/alias
   choices and warm-cache/child-policy controls.
3. **Ordinary expression type slots:** creation, arrays, `typeof`, `default(T)`,
   `sizeof`, stack allocation, catch, `as`/patterns and protected casts. Do not
   change constructor/default/conversion/grouping syntax.
4. **Remaining certified roles:** the accepted tuple/ref/scoped/fixed/function-pointer,
   primary-constructor, explicit-lambda-return and other mapped cases,
   using their bounded role contracts and language gates established upfront.

Source-observation extensions are not categorically outside Task04: some original
constructor/delegate/lambda/explicit-override cases need additional bounded shared
facts. Each addition must name its accepted anchor, consumer and minimal missing
fact. It is not a request for universal constructor/delegate/overload resolution.

## Validation and completion

Follow regression-preserving implementation: reproduce the exact selected
original failure before production edits and preserve its expectations. Assert
prepared decisions and raw output before legacy processing; then parse/compile
in tests and compare exact targets/constructions/type-parameter owners, operations,
relevant diagnostics, emit/runtime and observed source text as applicable.

Use the already valid Foo fixture first, not an unrelated multipart fixture with
a known invalid derived constructor. If a baseline has unrelated diagnostics,
compare and disclose them; do not repair unrelated emitter policy as part of this
slice. Keep wrong/invisible aliases, unbound/error graphs, namespace-segment
capture, protected-cast/bare-pattern distinctions, trivia exclusions and warmed
cache controls meaningful.

Run focused regressions during iteration, then required broader core/client and
affected writer/provider/reference/capture/residual/integration checks plus
independent review at stable scope. Reuse valid unchanged evidence; rerun checks
invalidated by changes. No full SDK regeneration or performance campaign is
implicitly required or authorized.

**Task04 completion still requires every accepted ordinary Task04 positive and
retention anchor, with prepared/raw and actual pipeline evidence.** The Foo
checkpoint alone does not finish Task04. Do not delete, mute, substitute, relabel
as unsupported or weaken an accepted positive to close the task. Reassignment or
a narrower formal completion contract needs explicit user agreement and an owner
ledger. Overall issue/default activation/final replacement remains later work.

## Expansion stop rules and checkpoint report

Before a substantial new rule, identify the original anchor, real consumer,
expected reduction benefit, incremental machinery and retained controls. Stop for
a bounded decision before adding a general parser/binder/inference/CFG engine,
new compiler host, parallel lifetime, arbitrary factory/getter support or a broad
language-emission framework. Continue other independent authorized work rather
than stalling the whole task.

Do not cache permissions by type/producer, memoize away mutable or sticky
observations, force lazy carriers, execute unknown formatting/getters to prove a
role, replay callbacks, or use legacy output to claim raw acceptance. This plan
also does not accept `global::` as the final generated SDK spelling.

Each checkpoint report should state: original reductions now working and their
raw before/after evidence; actual coverage versus estimates; reused/new facts and
why they are needed; remaining accepted cases and explicit boundary decisions;
source revision, executed tests, review findings and outstanding CI.
