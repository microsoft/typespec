# Provider-aware name reducer prototype

> Historical combined-provider prototype. See [ProviderReducerStatus.md](ProviderReducerStatus.md)
> for the current structural checkpoint, applied rules, AppService gap and validation.

This is an **opt-in, incomplete proof of concept**, not a production replacement
for Roslyn's complete simplifier. Roslyn remains the default reduction pipeline.
The optional-default emission fix below applies in both modes.

## Enable

Set `TYPESPEC_PROVIDER_REDUCER=true` before constructing writers/workspaces.
Keep `disable-roslyn-reduce=false` to exercise reduction. Unset the environment
variable to use the original Roslyn simplifier pipeline.

The writer records qualified type-reference spans and identities, including named
array elements. The reducer validates those records and uses shared compilation
symbols plus conservative document-wide scope checks to shorten supported names.
Decisions are cached per immutable document scope and named type definition;
sorted, disjoint namespace-prefix deletions are applied in one string pass.
The normal provider path avoids annotations, AST replacement and per-document
semantic models. If another rewrite changes the root, original writer offsets
are not applied. Uncertain names or
documents keep their original qualification; **there is no Roslyn simplifier
fallback in provider mode**. Custom rewriters retain their semantic-model contract.
The shared generated-source compilation has not been eliminated.

## Optional-default emission

The original PoC failed real generated-library compilation because optional
`CancellationToken` defaults retained the writer's expression:

```csharp
CancellationToken cancellationToken = ((global::System.Threading.CancellationToken)default)
```

The compiler rejects this with CS1736. Source comparison found 166 instances
across copied internal helpers. The writer now emits `default(T)` directly for
an optional parameter whose default is a cast of bare `default` to exactly its
declared type. Casts elsewhere, mismatched cast types and other defaults remain
unchanged. Raw-compilation regressions reproduce and fix the original struct
failures without a simplifier fallback.

Assignment statements also omit the outer parentheses of a binary assignment;
transparent scoped wrappers are inspected only at that statement boundary.
Nested expressions keep their original grouping. This repairs CS0201 from the
actual `AddAndAssign` helper without broad expression/cast simplification.

## Other incomplete simplifications

The prototype is deliberately more conservative about qualified names, nested
and inherited types, casts, static receivers, attributes, XML cref and unsupported
syntax/layouts. It also retains explicit `this.`, generic invocation arguments,
framework names instead of keyword aliases, attribute suffixes, parentheses and
pattern grouping that Roslyn may simplify. These differences require separate
acceptance/semantic review; textual parity is not established.

## Validation of the original PoC (7b4113e4f)

- 195 targeted core/writer/binding/integration tests passed.
- 2,983 full core-generator tests passed. Most existing tests use default mode;
  dedicated provider tests explicitly exercise the opt-in path.
- Binding oracles compiled both trees and reparsed emitted text and compared type
  bindings, including array composition/collisions and inherited-scope guards.
- Official real test-project regeneration in Roslyn mode succeeded; baseline
  Spector tests: 956 passed, 10 skipped.
- Provider regeneration failed Sample compilation with CS1736; finishing Spector
  generation likewise produced 158 reported CS1736 diagnostics before tests ran.
  The aggregate Spector project does not reference every generated library.
- Real-output comparison: 3,007 changed C# files, no added/removed files. A
  diagnostic syntax taxonomy accounted for the differences, but does not prove
  binding/runtime equivalence.

## Cached/text iteration (current worktree)

- 420 affected statement/expression/default/binding/no-fallback tests passed.
  All original reference identities and parse shapes are checked in actual
  emitted/reparsed text, including nested edits and retained references.
- Raw default compiler regression: four CS1736 failures before the writer fix;
  struct, nullable, primitive, enum and reference controls pass after it.
- Final full suites: 3,015 core and 2,509 client-model tests passed.
- Independent planner review found no blockers. Statement review caught a missing
  scoped-wrapper path; the faithful helper regression reproduced it before the
  correction, and follow-up review found no remaining blockers.
- Official unfiltered real-implementation regeneration succeeded. Sample builds
  successfully (its scaffold has no discoverable tests); real Spector tests:
  956 passed, 10 skipped. Generated source restoration was hash-verified.
## Actual AppService pipeline comparison

Local saved-input management-generator execution, matched Roslyn5.9, four fresh
processes in ABBA order (two samples per variant). Complete generation includes
parsing, index/scope planning and materialization, not precomputed edit timing.
Frozen unchanged SDK/Input/ClientModel layers used the rebuilt compatible core.
This is not fresh TypeSpec compilation or an entirely rebuilt SDK distribution.

| Mean | Roslyn5.9 | Cached/text provider |
|---|---:|---:|
| Elapsed | 171.44 s | 61.94 s |
| Managed allocation | 30.57 GiB | 11.05 GiB |
| Peak working set | 2.37 GiB | 1.37 GiB |

Observed **2.77× elapsed ratio**, **63.9% less elapsed/allocation**. Both variants
emitted2,301files, deterministic within each variant. Both independently rebuilt
netstandard2.0/net8.0/net10.0 and passed configured ApiCompat against AppService1.5.0.
All2,235changedfiles were syntactically categorized with zero parse errors or
unclassified differences; this is not proof of semantic identity.

## SDK-gap reduction: static type prefixes and attributes

A follow-up bounded pass shortens recorded static TYPE prefixes (keeping the
member receiver), and independently proves attribute prefix/suffix reductions.
Expression lookup conservatively blocks query and implicit accessor names;
lookup kind participates in document caches. Contextual-keyword attribute short
names retain suffixes, including cached ordinary/async occurrences.

Against the same Roslyn output, categorized differences fall **147,326→129,348**
(**17,978 fewer;12.20%**):11,874staticqualifications,4,695attributesuffixes and
1,409attributequalifications removed. Changed files2235→2167; identical66→134.
No parse errors or unclassified differences. File/category counts overlap.

Fresh matched providerV1↔V2 ABBA means: **57.78→57.42s**, **11.028→11.024GiB**
allocation, **1.377→1.372GiB**peak. Treat this as **essentially flat/no observed
performance regression**, not a demonstrated sub1%speedup. Do not compare with
historical61.94s and claim an extra4s gain from this cleanup.

Final3,041core/2,509client tests pass;97targetedcases include type/member/attribute
constructor/nameof binding oracles. Unfiltered real regeneration and956Spector
passes/10skips;both SDKvariants rebuild3TFMs+ApiCompat successfully. Sample builds,
but scaffoldhas0discoverabletests. Fresh sources restored/hashverified. Default(T),
ordinary type/cast guards, conditional opt-out, this/parentheses/cref/inference
remain unchanged by this pass.

These are two local samples per variant on one management SDK, not a production
performance guarantee. The candidate includes valid-emission repairs as well as
cached planning/text edits. Additional representative SDK/binding/runtime coverage
is required before default enablement. Fresh test-project and SDK service backups
were restored/hash-verified. This iteration remains uncommitted and opt-in.
