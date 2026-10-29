# Structural type-name reduction: rules and test matrix

> Historical design/experiment log. See [ProviderReducerStatus.md](ProviderReducerStatus.md)
> for the current accepted rules, AppService gap, validation and remaining groups.
> Scope exclusions and measurements below describe their individual historical stages.

**Status: opt-in generator integration implemented and validated, not a default
replacement.** Sections 11–12 record the initial slice; section 13 records the
expanded type-only qualification coverage and its measured cost. Section 14 records
namespace experiment A, validated/measured and accepted as B's baseline. Section 15
records B; section16 records accepted C, and section17 records D's opportunity
screen (no production change). Section 10 records the executable rule
prototype; section 11 documents its promoted shared selector and the bounded
production integration. Attribute reduction is outside this mode.

## Goal and non-goals

Choose a less-qualified spelling of a **known type reference** by resolving a
structural name in its real scope. Do not progressively trim strings or run
independent cleanup passes. Attribute names/suffixes are outside this design;
attribute arguments can contain ordinary type references and use the ordinary
rules where their provenance/context is known. Do not introduce aliases/imports,
remove member receivers, infer method arguments, change casts/defaults, or chase
Roslyn textual parity. Existing primitive-keyword emission is not redesigned.

The previous combined prototype has valuable correctness anchors but is not the
intended architecture: its measured additional cost does not authorize repeating
its document-wide scans or emitted-source prefix edits here.

## 1. Decision contract

Given a reference R to target T, select a ranked candidate N only if:

1. T's identity is established in the current compilation/reference universe.
2. N resolves to T under the language lookup rules for R's scope and lookup mode.
3. N preserves the surrounding syntactic interpretation and identifier spelling.
4. Every supported output configuration relevant to R agrees on these facts.

Otherwise use a more-qualified candidate or preserve the original reference.
A retained name is an explicit decision, not an invitation to a semantic fallback.

Target identity includes the named definition, containing-type construction and
argument identities. Type parameters use declaring-owner identity + ordinal, not
just their names. Resolve runtime/provider provenance into the compilation's
canonical identity once; raw runtime assembly names are not a substitute for
reference-assembly/type-forwarding resolution. Missing, ambiguous, or unestablished
identity means retention. Namespace/name/arity strings alone are not sufficient.

### Structural inputs (conceptual, not proposed API signatures)

- **Reference:** target identity, scope/lookup-region ID, lookup mode, grammar role,
  configuration-set ID, and provenance. Existing spelling may be preserved.
- **Name form:** root kind (unrooted/global namespace/existing namespace alias/
  existing type alias), namespace symbols, containing named-type chain with its
  arguments, terminal named type, and identifier-escaping information.
- **Scope:** enclosing namespace/type/method/block regions, type parameters,
  applicable imports/aliases, and declarations visible under the relevant lookup
  mode. Source partials and inherited members contribute through shared indexes.

`global::` is the global-root name form in C# syntax; no textual prefix removal
rule is needed. Namespace aliases and type aliases are different root kinds.
A namespace alias can use alias qualification; a type alias is not a namespace.

## 2. Candidate construction and selection

Construct candidates from the target's containment graph and existing alias
bindings. Do not discover boundaries by splitting fully qualified source text.
The finite candidate set consists of:

- terminal type alone;
- successive suffixes of the containing-type chain, with required constructions;
- namespace-qualified paths that retain the complete required type chain;
- existing aliases whose bound targets structurally match a usable root;
- unrooted and globally rooted complete paths, where those roots are meaningful;
- the original spelling as a preservation outcome.

Each candidate is independently resolved from the use site. A failed simple name
can lead to `Outer.Inner` or `B.Widget`, not necessarily directly to the longest
name. Preserve all generic argument lists; argument references are separate typed
children, not text embedded in the outer candidate.

Rank legal candidates by qualification-segment count. Alias introduction is not
implied: preserve an existing explicit alias on ties; otherwise prefer ordinary
unaliased spelling before an alternative alias, with a stable structural tie-break.
This policy is proposed and must be pinned by tests before implementation; do not
add source imports or change namespace-wide policy to make one candidate work.

## 3. Reduction rules

| ID | Scenario / candidate | Required proof | Fallback |
|---|---|---|---|
| R0 | Any recorded named reference | Canonical target, well-formed provenance, known scope/context; original reference is usable | Preserve original on missing/ambiguous identity or opaque provenance |
| R1 | Current/enclosing namespace or imports: `Widget` | Ordered C# type lookup in the actual scope selects T; ordinary/global imports contribute at their proper lookup level | Continue to owner/namespace candidates |
| R2 | Nested type: `Inner`, `Outer.Inner` | Containing and inherited type lookup, accessibility, and containing constructions resolve the complete chain to T | Keep required owner(s); never drop an owner solely because the terminal name is unique somewhere |
| R3 | Namespace suffix: `B.Widget` | Resolve first segment and each subsequent namespace/type segment; exact target at the end | Try a longer namespace path |
| R4 | Existing alias: `DTO`, `S::Widget` | Alias binding and its scope are known; root kind is legal; bound construction is identical | Do not invent an alias; retain another legal form |
| R5 | Unrooted full path: `A.B.Widget` | First segment cannot be captured by a nearer type/value/alias/namespace under this lookup mode | Retain global root |
| R6 | Generic / nested-generic name | Preserve definition arity, containing substitutions, argument order and identities; independently resolve argument references in type mode | Retain qualification without changing construction |
| R7 | Type reference as an expression receiver | Expression lookup selects the type rather than a value; unchanged access still denotes the intended member/overload where a proof is available | Preserve type qualification; do not reduce the complete member receiver |
| R8 | `nameof` type prefix | Same referenced symbol (or applicable symbol set) AND same constant, not merely equal terminal text | Preserve qualified operand; do not turn a member reference into an unqualified identifier |
| R9 | Writer-owned whole-type cref | Documentation-specific scope, syntax and identity are preserved | Leave raw/member/prose/unrecorded cref alone |
| R10 | Every candidate in its grammar role | Escaping, lexical boundaries and surrounding parse shape remain valid; keep wrappers/operators unchanged | Choose a more-qualified form or original spelling |
| R11 | Conditional source / external declarations | Same resolution and grammar result across the explicit supported configuration set | Retain affected reference/scope when proof is unavailable; global imports may legitimately affect all scopes |

Lookup precedence matters. An outer namespace/import collision does not override
an already winning nearer declaration. Conversely, uniqueness across a flattened
set of visible names does not prove the C# lookup result. Accessibility filtering
must be applied at the appropriate lookup stage, not by treating an inaccessible
nearer declaration as if it never existed.

## 4. Lookup modes and syntax roles are separate

| Mode | Examples | Distinguishing rule |
|---|---|---|
| Type | return/parameter/field types, `new T`, casts, `typeof(T)`, type patterns, generic arguments | Use namespace/type lookup, not a document-wide set of value names |
| Expression type receiver | `T.Member`, `T.Method(...)` | Values can capture the left side; retain the member access and selected operation |
| Nameof | `nameof(T)`, recorded type prefix in `nameof(T.Member)` | Preserve symbol identity/set and constant |
| Whole-type cref | `cref="T"`, generic type descriptions | Documentation lookup and identifier/generic rendering rules |

A lookup mode alone is not enough for the cache. Grammar roles distinguish, for
example, a variable declaration type from a return type or a cast operand.

**R10 examples checked by the scenario oracle:** the preliminary example
`(global::N.T)-x` is NOT a valid starting cast: qualification does not fix it.
The valid cast fixture preserves its negative operand's parentheses:
`(global::N.T)(-x)` can shorten to `(T)(-x)`. A separate oracle control, `(int)-x`
versus `(global::System.Int32)-x`, checks that equal type identity is insufficient
for grammar preservation; it is NOT a proposed reduction or a keyword-emission
change. Likewise a qualified `await` still needs escaping inside an async method:
use `global::N.@await` as the valid original and `@await` as its candidate.

Shortening a qualified contextual-keyword name must not introduce inference or
async parsing behavior. Use language token/grammar rules and contextual escaping,
not a private replacement-name map. Retain original syntax if a bounded grammar
proof is unavailable. Parser/binder checks belong in regression oracles; this
design does not prescribe per-reference production reparsing or speculative binding.

## 5. Rule-and-test matrix

This is the **full planned coverage catalog**, not a claim that every combination
has been tested. An executable candidate-oracle subset is described in section 9.
The final column identifies pre-existing anchors worth preserving, not exhaustive
coverage of that row.

| Test family | Positive / reduction expected | Negative / retention or longer candidate expected | Existing anchors / gaps |
|---|---|---|---|
| Current/imported type | Current namespace; enclosing namespace; ordinary and global imports | Duplicate imports; nearer type collision; inaccessible nearer declaration | Existing basic/imported/reference-binding tests; explicit precedence/global-import tests still required |
| Partial namespace | Ambiguous simple `Widget`, but unambiguous `B.Widget` | First namespace segment captured by a type or alias; both suffixes ambiguous | Existing ancestor collision retention; positive partial-path selection is new |
| Global-root-only | Complete unrooted namespace path is safe | Namespace/type/alias captures its first segment | Existing global qualification guards; explicit intermediate-root selection is new |
| Nested owner | Outside owner needs `Outer.Inner`; inside owner can use `Inner` | Competing `Inner`; inherited nested type; private owner; multilevel chains | Preserve `NestedFrameworkTypeStaysQualifiedInFirstPrototype`; new rule needs independent desired-reduction fixtures, not silently changing that anchor |
| Generics | Same definition/arity with independently shortened arguments; nested generic owner | Same simple name with different arity; differently constructed owner; different type-parameter owner | Existing generic/array binding anchors; constructed declaring-type and arity competition need new tests |
| Wrappers | Named leaf inside array/nullable/tuple/pointer forms without wrapper changes | Unknown leaf target; wrong generic/nullable construction | Existing nested-generic/array fixtures cover some leaves, not nested CLR declaring types |
| Aliases | Preserve explicit type alias; use a proven existing namespace alias where selected | Alias points to another type/construction; alias hidden/out of scope | Existing alias-collision retention; alias-selected reductions are new |
| Extern/assembly identity | Preserve established explicit assembly-alias form | Same metadata name in different assemblies; unresolved forwarder; unsupported extern-alias shortening | New identity tests; keep unsupported extern-alias forms initially |
| Type versus value scope | Local `Widget` elsewhere must not block a type-only reference; sibling methods independently resolve | Local/parameter/property/query/pattern variable captures `Widget.Member`; method type parameter captures a type | `TypeAndShadowedExpressionDecisionsDoNotShareCacheEntries` exists; same-method lookup-mode and sibling/nested-region positives still required |
| Partial/inherited declarations | Benign partial/base declarations do not block unrelated names | Collision in another part/base/interface; nested generic owner substitutions | Existing partial/inherited/interface/global-versus-namespace anchors |
| Nameof | Shorten proven type prefix while preserving member and constant | Same string but different symbol; shadowing; overload/symbol-set change | `NameofStaticMemberKeepsItsTargetAndConstant`; `NameofConstantAloneDoesNotProveTargetIdentity` |
| Whole-type cref | Same documentation ID/assembly with shorter type path | Method/type parameters capture a name; member/prose/unrecorded reference; nested construction unknown | Existing cref OriginalDefinition DocID/assembly oracles; alias/type-parameter collision cases remain |
| Grammar/spelling | Safe type-position shortening; correctly escaped identifiers | Cast versus subtraction/delegate ambiguity; contextual identifiers; token joining; changed wrappers | Preserve ambiguous-cast and combined-delimiter/assignment anchors; add role-specific name-shortening cases |
| Configuration | Identical identity across explicit framework/project-flag environments | External conditional type, global alias/import, changed base/header, semantic directive state, branch-local capture | Existing conditional partial, NET5 alias, original NET9-only branch and nullable anchors; cross-project-flag safety is NOT established |
| Unknown/raw source | Original spelling stays unchanged | Stale/missing site identity, unsupported source shape, customization changes reference ownership | Existing malformed-site/changed-root offset/provenance anchors |
| Cache isolation | Repeated identical target/environment shares a decision | Different region, context, grammar role, construction or configuration shares no unsafe decision | Existing type/expression cache isolation; add nested-region/construction/configuration isolation |

The baseline combined prototype retains a fixed-project-flags limitation. The new
rules must name their supported **output build configurations** explicitly. Do
not call a DEBUG/HAS-dependent declaration absent merely because the generator's
current parse options omit that flag. Unknown configuration effects require
retention at the conservatively affected lookup scope. This is a design requirement,
not a claim that the current prototype already implements such dependency tracking.

## 6. Work-sharing and emission constraints

1. **One shared environment.** Declaration identity, imports, aliases, partial/base
   contributions, scopes and references must not be reconstructed independently
   for type names, expression receivers, nameof and cref.
2. **One collection per required input view.** Reuse the existing compilation,
   syntax trees and existing provider/writer traversal where sufficient. Do not
   separately scan the same tree for aliases, locals, references and each rule.
   Distinct necessary active configurations are distinct views, cached and reused.
   Do not reparse a variant for header proof and again for site collection.
3. **Carry context instead of rediscovering ancestors.** Capture a scope/region ID,
   lookup mode and grammar role once. Writer brace depth/temporary-name allocation
   alone is not a complete C# lookup scope graph.
4. **Share target structure.** Intern namespace/type containment and type identity;
   do not build/split fully-qualified strings per occurrence or walk symbol trees
   for every candidate. Query referenced-assembly namespaces/types lazily and cache.
5. **Cache complete decisions.** Key by canonical constructed target, immutable
   lookup environment/region, mode, grammar role and configuration set. Include
   original-form/alias policy or original-syntax facts if they affect selection or
   preservation. A document ID or simple type spelling is insufficient. Cached
   retention outcomes also need explicit reasons.
6. **Plan names, then emit once.** A decision is a structural name form, not a list
   of substring replacements. The existing type/identifier renderer emits it once
   with its arguments, wrappers and correct escaping. No qualified output → trim
   → attribute rewrite → secondary name rewrite chain, and no new string-edit pass
   as the default architecture.
7. **Preserve uncertainty without rescanning.** Record reason codes such as
   unknown identity/provenance, ambiguous lookup, value capture, grammar risk or
   configuration dependence while deciding. Diagnostics should aggregate those
   decisions, not traverse output again to infer why names remained qualified.

There may still be distinct necessary stages for collecting scope facts and final
emission. The constraint is to avoid duplicated discovery/repeated rewriting, not
to claim that future declarations are already known at a streaming write site.

## 7. Integration choice remains open

Observed current hooks:

- `TypeReferenceSite` records a span, CSharpType and code/whole-cref role, but not
  the complete lookup-region/grammar context proposed above.
- `CodeWriter.AppendType` emits qualification immediately, before final source
  processing; it also registers namespace uses. Import registration and import
  visibility must not become circular inputs that change during candidate lookup.
- `CodeWriter` has brace scopes, but raw writes and method/body semantics mean
  those scopes cannot simply be equated with language lookup scopes.
- `GeneratedCodeWorkspace` already obtains a compilation and processes source
  trees; current `ProviderNameReducer` combines matching, document blockers and
  edit planning. Reusing this information is different from adding another pass.

Before implementing, choose whether complete facts can be supplied from existing
provider/structured-body construction before writing, or whether named references
must be represented as deferred structural fragments until scope facts are known.
Raw/custom syntax without sufficient facts may remain opaque. If existing member
removal/customization changes ownership or scope, freeze/refresh the shared facts
at the correct boundary rather than replaying stale decisions.

Do **not** silently choose span rewriting to avoid resolving this integration
question, and do not introduce a second general AST/code-model traversal without
an explicit account of what the existing traversal cannot provide.

## 8. Proposed staging and acceptance gates

1. Agree the identity, lookup/context, grammar and configuration contracts above.
2. Pin positive/negative tests for the simplest type-only and static-receiver
   rules; preserve all original regression anchors. Reproduce desired missing
   reductions against the current/base implementation before production edits.
3. Select the integration that provides facts once and emits each chosen name once;
   explicitly account for raw writes, imports, member removal and customizations.
4. Implement only the agreed initial subset. Record retention reasons and counters
   for environment construction, unique decisions/cache hits, variant parses,
   retained references by reason, and name emission. These are future acceptance
   requirements, not instrumentation installed by this document.
5. Validate emitted/reparsed type identity and the enclosing operation as relevant;
   nameof constant/symbol and cref documentation-ID oracles stay separate. Tests
   must cover both successful reduction and safe retention, including custom/raw
   and cross-file/configuration cases.
6. After focused checks stabilize, run only the broader suites/generation/build
   gates invalidated by implementation. Measure the actual full generation path
   against the frozen baseline; do not infer gains from lookup microbenchmarks.
   A new matched Roslyn comparison remains deferred until requested.

No production implementation, new postprocessing pass, new string rewriting,
changed existing regression expectations, attribute rollback, SDK regeneration or
benchmark follows merely from writing this matrix.

## 9. Executable candidate-oracle tests

`test/StructuralTypeNameRuleOracleTests.cs` supplies explicit original and candidate
spellings in small source fixtures; it does not call `ProviderNameReducer` or
implement automatic candidate selection. Fixture text substitution is test-data
construction only, not a production rewriting strategy.

For each specified configuration, the compiler oracle requires a valid original
and evaluates candidate diagnostics, canonical reference identity (including
constructed owners/arguments/nullability), enclosing symbol/type/constant results,
and reparsed grammar outside the substituted name. Method-local type-parameter
owners need structural source-declaration identities: documentation IDs can collide
between a member method and a local function. An oracle integrity control for that
collision was independently reproduced before correcting the helper; a positive
control checks owner identity remains stable when a containing name is shortened.
Conditional counterexamples assert candidate validity in each individual flag
configuration, not just an aggregate failure. Negative controls cover
compiling-but-wrong targets, equal nameof constants with different symbols,
argument/owner construction changes, value capture, and conditional external
collisions. Additional controls reject invalid original examples and demonstrate
that a different overload is detected even with an identical referenced type.

These tests establish that specific proposed candidates are admissible or must
be rejected. They do NOT prove that the prose rules handle all C# cases, that the
production reducer follows them, or that a candidate is the shortest legal form.
Once a production selector exists, reuse these cases for selection/conformance
checks and pass its emitted candidate through the independent oracle. The enclosing
operation checks cover selected ancestor syntax categories, not a complete
IOperation tree, all operators/indexers, or every implicit conversion. Extend the
oracle when adding those scenarios. Cache behavior, provenance, assembly-forwarding/
extern-alias cases and the full configuration universe still require separate
fixtures.

The first 39-case run passed 36 and rejected three invalid ORIGINAL fixtures.
Those invalid examples remain as diagnostic controls; the corrected cast/async
examples above supersede the inaccurate preliminary examples, not the existing
production regression anchors. The local-function owner collision subsequently
reproduced an actual false-positive oracle result (45 passed / 1 failed); the
structural declaration identity correction and owner-stability control close it.

Initial oracle-only milestone: **44 explicit candidate scenarios + 3 oracle/fixture
controls = 47 new tests passed**, alongside **137 existing regression anchors**,
for **184 passed / 0 failed / 0 skipped**. Section 10 records the subsequent expanded
suite and automatic selection results. Independent static review informed the owner
collision control; the reproduced failure and passing correction are retained.
No production reducer or existing test expectation was changed. That initial
oracle milestone did not exercise an automatic selector; section 10 documents the
subsequent selection implementation and verification. No SDK generation, benchmark
or full generator suite was run for this test-only work. Execution receipts are under
`.pi/benchmarks/provider-reducer-structural/` and `.pi/structural-scenarios*.log`.

## 10. Executable structural selector (test-only)

`test/StructuralTypeNameRuleEvaluator.cs` now executes candidate construction,
resolution and ranking. `StructuralTypeNameRuleEvaluatorTests.cs` supplies expected
selections and runs each chosen spelling through the separate compiler oracle.
The evaluator receives only original references/configurations: expected spellings
and the oracle's manually supplied candidates are not evaluator inputs.

### What is executable

- Namespace and containing-type chains produce simple, owner-qualified, partial-
  namespace, global-root and existing-alias name forms structurally.
- Root and member lookup facts are supplied by Roslyn's ordinary lookup APIs,
  cached within one evaluation. This is **not yet a generator-owned scope index**.
- Each path segment must have one binding at that lookup stage. Later suffixes
  cannot remove an ambiguous owner and retroactively validate the path.
- Constructed target identity is checked separately in every configured view;
  nameof spelling/constant constraints also apply in every view, not just the first.
- Ranking uses structural component count and preserves an explicit original alias
  on a tie. Namespace aliases and type aliases have distinct syntax/root behavior.
- Identifier escaping uses language token facts. Only the selected form is emitted
  as an AST name. No Simplifier, speculative binding, candidate parsing, fully-
  qualified-string splitting/replacement, or whole-source traversal is used by
  the evaluator. Candidate recompilation is confined to the independent oracle.
- Source-name parts/root-alias and enclosing context are captured once per view;
  lookup facts are shared across candidate forms. Tests check actual snapshot
  counters (including repeated unsuccessful alias paths), not elapsed microtimings.

### Safe retention and limits

Non-named/predefined inputs, unbound types, significant reference trivia,
unsupported cast forms, generic crefs and incompatible configured type-chain
shapes are retained with explicit reasons. Generic argument syntax is preserved;
recursive argument-name reduction is **not yet implemented**. A heterogeneous
configuration can therefore have a legal shorter name that this prototype
intentionally does not select. It is not a proof of global shortest-name selection.

Fact caches are scoped to **one evaluation**, not shared across all references in
a generator region. Replacing compiler lookup services with shared generator-owned
facts, integrating scope discovery/imports/customization/member removal, and
emitting directly in the production writer remain later design/implementation
work. No production efficiency or SDK coverage improvement is inferred here.

### Regression history and results

The preserve-only starting stub failed 41 selection tests while 48 other checks
passed, reproducing the missing behavior before implementation. The first selector
passed 42 automatic selections plus 47 oracle tests. Additional alias tests caught
loss of an explicit namespace alias on a ranking tie; root-alias identity is now
captured during the same structural source-part collection.

Independent review then supplied three concrete boundaries. All reproduced before
correction (105 passed / 3 failed):

1. `Outer.Inner` cannot disambiguate two imported `Outer` types merely because only
   one declares `Inner`.
2. A type alias valid in a first `typeof` configuration can change a nameof constant
   in a second configuration.
3. A reference whose containing-type chain changes between configurations must
   not index another view's chain by the first view's ordinal and throw.

The selector now rejects intermediate ambiguity, checks role-dependent constraints
in every view, and explicitly retains incompatible containment shapes. Original
counterexamples and safe alternatives remain independently compiler-checked.

**Current validation: 50 automatic selection cases + 55 independent oracle/fixture
cases + 3 cache/retention controls + 137 pre-existing anchors = 245 passed,
0 failed, 0 skipped.** Receipts: `.pi/structural-evaluator-final.log` and
`.pi/benchmarks/provider-reducer-structural/evaluator-final.trx`.

Only test/specification files were changed for that rule-prototype stage; no
production rewrite pass, attribute changes, SDK generation, fresh Roslyn comparison
or benchmark was run then. Section 11 describes the subsequently authorized
production integration.

## 11. Initial generator integration: `structural` mode

The user approved implementing a bounded slice after the rule tests. The shared
rule engine now lives in `src/PostProcessing/StructuralTypeNameSelector.cs`; the
old test evaluator is only an input adapter. Expected selections and the independent
compiler oracle remain test-only. Production code does not depend on test helpers.

### Chosen boundary and mode routing

Use `TYPESPEC_PROVIDER_REDUCER=structural` for the new experimental mode. Unset/off
still uses the existing Roslyn path; `true` still selects the previous provider
implementation. There is no default rollout or attribute rollback.

Complete compilation facts become available in `GeneratedCodeWorkspace` after
all source files have been added. `StructuralTypeNameReducer` supplies a separate
stateful subclass of `MemberRemoverRewriter` for each eligible document. Name
selection/replacement occurs DURING that existing traversal; base namespace/
compilation-unit pruning still runs, followed by the existing final serialization.
No preliminary reference-matching walk or extra whole-tree rewrite pass is added.

**The qualified CodeWriter draft remains analysis input.** This does not claim
direct first-write name emission or elimination of all parsing. The reused global
conditional header proof still inspects/parses configuration views. Its conditional-
tree classification is now cached once per tree instead of rescanned per mode call.

### Initial supported slice

- Writer-recorded Code references, exact original spans and structurally verified
  global namespace/containing-type paths.
- Named targets with no generic terminal or generic containing owner.
- Declaration type positions: field/local variable, property/indexer/event,
  method/local-function/delegate return and parameter types, including supported
  array/nullable/pointer wrappers and ordinary declaration generic arguments.
- Generic containing-type-segment arguments are conservatively retained; explicit
  positive/retention fixtures pin that limitation.
- Attributes, cref, new/cast/typeof/nameof/pattern/receiver/base/constraint and body
  invocation-generic contexts are not reduced by this integration.
- Conditional TARGET documents remain opaque. Global header safety still includes
  other trees, under the existing explicit fixed-project-flags contract—not a
  universal proof across later DEBUG/HAS changes.

### Shared facts, caches and provenance

Canonical metadata lookup includes namespace + CLR declaring-type chain and is
cached at compilation level. This string is metadata identity input, not emitted
source matching or rewriting. Every occurrence independently validates its span,
role, original global root, full structural spelling and context before any
cache hit. The first target in a lookup region also binds to the expected canonical
compilation symbol; uncertain/ambiguous metadata is retained.

Traversal state, semantic model and caches are document-local. Original type,
method, local-function and delegate declarations establish separate type-lookup
regions. One region shares its compiler-backed lookup facts and target decisions;
requested root/member names are queried lazily and cached with the same region/
accessibility context. A once-per-compilation alias-NAME index visits namespace/
using headers, not type or method bodies; actual alias binding remains per region. Cached replacement
syntax carries no occurrence trivia; each use preserves its own trivia. Significant
interior trivia, duplicate/invalid spans, wrong roles and wrong identities retain
original names. No Simplifier fallback or source-string edit chain is used.

Custom-rewriter projects retain their semantic-model/formatting contract without
structural selection. Disabled reduction and absent usable metadata do not fall
back to Roslyn simplification in structural mode.

### Initial-slice validation state

Seven production-mode gaps were reproduced before integration. The first working
slice passed the rule suites and all but one overqualified test expectation; that
new expectation was corrected to the already verified safe `System.DateTimeOffset`
form, retaining a mode-specific assertion and emitted-symbol oracle.

Static production review found no confirmed unsafe rewrite. It identified omitted
local/delegate types in the integration oracle; two deliberate type changes then
reproduced false passes (17 pass / 2 fail). The oracle now includes local variable
and delegate return types and uses declaration ordinals instead of colliding local
function documentation IDs for declaration keys. It checks the actual emitted
source against original declaration identities after recompilation.

**282 focused checks passed**, including existing anchors, promoted selector/
compiler-oracle cases and 24 actual generator integration cases. Six additional
alias cases cover another-tree global aliases, file-scoped/nested/inner namespaces,
invisible sibling aliases and same alias spellings with different targets. They cover scope
restoration, independent documents, metadata namespace separation, cache-hit
provenance/trivia/roles, empty-namespace pruning, excluded contexts, aliases,
nongeneric nested owners, generic-owner retention and conditional/disabled/custom
mode routing. Real scoped Sample generation/library build passed; 2,186 original
files were hash-restored. Its test scaffold still discovers zero tests.

Final validation: **3,226 core / 2,509 client tests**, official unfiltered structural
generation, **956 Spector passed / 10 skipped**, and independent SDK three-TFM
Rebuild/ApiCompat all passed. Test-project and SDK snapshots were hash-restored.
Exact production source matches the measured build. No commit/push/default rollout.

## 12. Requested-name collection and measured boundary

The first integrated collector enumerated all visible scope/container symbols.
Although correctness gates passed, its actual AppService generation took 104.317s
versus a fresh 73.588s combined-provider baseline, with nearly double allocation.
That measurement is rejected as a performance result; preserved in
`.pi/benchmarks/provider-reducer-structural/full-generation/`.

A bounded correction queries only requested names, memoized by region/mode/name
and region/container/mode/name. Alias names are collected once through compilation-
unit and namespace using declarations; source type/method bodies are not visited.
This IS an extra shared namespace/header index, not a claim of zero extra discovery.
`ScopeSnapshots` counts lazy lookup-choice views, not Roslyn calls; `RootQueries`
and `MemberQueries` are the actual query counters. Using-alias discovery does not
include extern aliases or previous script submissions, which remain unsupported.
Named lookup APIs can expose non-source-referenceable symbols omitted by the old
all-name API; no unsafe path was found in this slice, but unconditional semantic
identity between those APIs is not claimed. Alias-name union work can still scale
with regions times distinct aliases. All caches remain region/document-owned except
the weak compilation-keyed alias-name index.

Corrected full actual-generation ABBA (two samples each), both Roslyn 5.9:

| Mean | Frozen combined provider | Structural declaration-type slice |
|---|---:|---:|
| Elapsed | 73.106s | 74.008s (+1.23%) |
| Allocated | 13,089,303,376 B | 13,158,104,792 B (+0.53%) |
| Peak working set | 1,621,039,104 B | 1,590,112,256 B (−1.91%) |

The corrected structural output is byte-identical to its initial structural output
in all 2,301 files. The local paired time is roughly flat, not evidence of a speedup
or statistical neutrality. Cleanup scopes differ: the combined baseline additionally
cleans expressions/receivers/attributes/crefs and conditional target documents;
the initial structural slice intentionally does not. Do not describe it as already
matching that broader cleanup coverage.

Saved-output taxonomy versus Roslyn: 165,725 events, including 69,509 type-name
qualification events; zero parse errors or unclassified residuals. This is larger
than the combined prototype's gap, as expected from the narrower integration. On
the same corpus, raw `global::` occurrences fall 157,120 → 118,130 against the
preserved no-plan writer draft (a raw occurrence count, not semantic proof).

Full receipts/report: `.pi/benchmarks/provider-reducer-structural/RESULTS.md`,
`summary.json`, `full-lazy/`, and `full-generation-lazy-facts/`. No new Roslyn timing
comparison was run; that remains deferred at the user's request.

## 13. Expanded type-only qualification coverage

The same opt-in `structural` route now additionally admits recorded **nongeneric**
named targets/owners in object creation, `typeof`, typed `default`, explicit array
creation, catch declarations, base lists and constraints. Casts are admitted only
when the original operand is already parenthesized. Ordinary generic-argument
leaves can reduce in these positions; generic targets/containing segments remain
retained. This does not add general expression/receiver or attribute reduction.

Base lists and constraint clauses have independent original-syntax lookup regions
and decision caches: a simple name available in a class header may bind to a nested
class in its body. Constructor/type operation checks supplement declaration checks.

Conditional target documents reuse the existing header/body eligibility proof,
with an additional conservative veto for **any generic local function in any
supported variant**. A conditional local-function wrapper around a common physical
reference can otherwise change its type-parameter owner while both parses compile.
Detection shares the existing declaration collector; legacy `TryGetRoots` eligibility
is unchanged. Only active original nodes are rewritten; disabled text is byte-
identical. This still uses the fixed-project-flags contract, not arbitrary future
DEBUG/HAS flags or all possible framework combinations.

`CallerArgumentExpression` observes source spelling, not just type/overload identity.
The visitor conservatively retains invocation, argument, conditional/indexed access,
initializer, interpolation and collection-expression subtrees before cache reuse.
Finally-restored traversal state avoids per-name ancestor discovery or another call-
binding pass. This intentionally leaves safe-looking names qualified even when the
particular callee does not capture text. Attribute subtrees remain excluded. The
qualified analysis draft and existing member-removal/final serialization boundary
remain unchanged; there is no new full-tree rewrite or source-string edit chain.

### Actual AppService coverage and performance

Fresh ABBA compared the **frozen initial structural** payload with expanded
structural, both env `structural` / Roslyn 5.9, with identical saved AppService
input and other generator layers. Baseline outputs replay the frozen initial
outputs byte-for-byte. No new TypeSpec compilation or fresh Roslyn timing.

| Mean, two processes each | Initial structural | Expanded structural | Change |
|---|---:|---:|---:|
| Elapsed | 66.718s | 72.374s | +8.48% |
| Managed allocation | 13,109,776,020 B | 13,691,010,948 B | +4.43% |
| Peak working set | 1,578,563,584 B | 1,639,206,912 B | +3.84% |
| Generated bytes | 24,358,750 | 23,306,277 | −4.32% |

This measures added coverage at added cost, **not a speedup** or per-family causal
cost isolation. Do not compare 72.374s directly with earlier 73/74s or historical
Roslyn timings: use this paired baseline and its two-sample limitation.

Remaining type-name qualification events versus saved Roslyn output fall
**69,509 → 34,749 (−50.01%)**. Raw `global::` occurrences fall **118,130 → 81,060**.
Static receiver 25,478 / cref 9,249 / attribute qualification 5,742 / nameof 2,399
are unchanged. Total syntax events fall 165,725 → 130,965; zero parse errors or
unclassified residuals. These are syntactic accounting events, not distinct types
or semantic-equivalence proof. The initial/expanded comparison emits 41,220 forward
and 4,150 reverse type-qualification normalization events; generic outer/argument
normalization can produce canceling events, not literal newly-qualified source.

Common remaining spellings include generic `IDictionary<string, BinaryData>`,
`ChangeTrackingDictionary<string, BinaryData>`, `ChangeTrackingList<string>`,
`Azure.Response<bool>` and `ValueTask<Response>`. These are diagnostic examples,
not an exact attribution of every remaining occurrence to an eligibility reason.

### Final validation and receipts

**307 focused / 3,251 full core / 2,509 client** checks passed. Official unfiltered
generation passed; **956 Spector passed / 10 skipped**. Sample builds and launches
its host but discovers zero tests (not runtime assertion coverage). Initial and
expanded AppService SDKs independently passed forced Rebuild/native compiler
invocation and configured ApiCompat against 1.5.0 for netstandard2.0/net8.0/net10.0,
with zero warnings/errors. Test-project 2,186 / SDK 2,677 files were hash-restored;
production source matches the measured build. A harness-only wrapper-reference
failure occurred after the full suites but before regeneration; corrected and
remaining gates resumed without rerunning unchanged suites.

Detailed evidence: `.pi/benchmarks/provider-reducer-structural-qualified/RESULTS.md`,
`summary.json`, `full/`, `full-generation/`. The earlier sections remain the initial
baseline history. No commit/push/default rollout or further feature expansion.

## 14. Namespace experiment A — accepted checkpoint

Inventory A–F is recorded in
`.pi/benchmarks/provider-reducer-structural-qualified/MISSING-NAMESPACE-LOGIC.md`.
A alone generalizes the **same namespace qualifier operation** over terminal named-
type syntax; B–F and other cleanup families remain untouched.

Exact recorded identifier-prefix spans now match the writer contract before type
arguments. Path/arity/canonical-definition checks replace the nongeneric-only
terminal restriction. The original constructed symbol proves lexical type-parameter/
nullable identity; error/unbound argument graphs are retained. Qualifier plans are
syntax-free, cached by constructed symbol with IncludeNullability, and render with
the current occurrence's terminal token and visited arguments. `Evaluate` and
`Choose` share the same candidate-selection engine. Nongeneric fast behavior remains
an internal materialization optimization, not another semantic rule or visitor.
Children and parent compose during the existing traversal; outer retention does
not discard child changes. Closed-type aliases consuming the terminal/argument
list are not selected by this prefix-only operation.

Generic-containing owners remain a disclosed boundary. Existing attribute,
source-observability, role, trivia and conditional guards remain intact. There is
one rewrite traversal, but per-name trivia and constructed-type-graph checks can
still revisit overlapping substructure; no separate optimization was bundled in.

Fresh actual saved-input AppService ABBA, frozen section-13 checkpoint vs A, both
`structural` / Roslyn5.9, two processes each:

| Mean | Checkpoint | A | Change |
|---|---:|---:|---:|
| Elapsed | 73.544s | 74.705s | +1.58% |
| Allocation | 13,704,702,396 B | 13,908,459,432 B | +1.49% |
| Peak working set | 1,629,364,224 B | 1,646,417,920 B | +1.05% |
| Generated bytes | 23,306,277 | 22,916,090 | −1.67% |

Remaining type-name qualification versus saved Roslyn: **34,749 → 21,280**, a
reduction of **13,469 (38.76%)**. Raw `global::`: **81,060 → 67,591**. Every other
syntax category is unchanged; checkpoint/A differs only by 13,469 type-name events
in 2,014 files. Both comparisons have zero parse errors/unclassified residuals.
Baseline replay matches the frozen checkpoint byte-for-byte across 2,301 files.
These are observed two-sample means and syntax accounting, not proof of statistical
neutrality, semantic equivalence or a same-output speed comparison. No fresh Roslyn
timing/TypeSpec compilation or comparison to earlier absolute timings is implied.

**331 focused / 3,275 core / 2,509 client** passed; scoped and official unfiltered
generation passed; **956 Spector / 10 skipped**. Sample builds but discovers zero
tests. Both outputs independently passed netstandard2.0/net8.0/net10.0 forced
Rebuild/native csc and ApiCompat1.5.0, zero warnings/errors. 2,186 test-project /
2,677 SDK files hash-restored; exact production source matches the measured build.

Receipts: `.pi/benchmarks/provider-reducer-namespace-a/RESULTS.md`, `summary.json`,
source/payload manifests, TRX, `full/`, `full-generation/`. **User accepted A and
authorized B**, using A's exact measured payload as reference. No commit/push/default
rollout or automatic promotion of B is authorized.

## 15. Namespace experiment B — accepted checkpoint

B changes only the reducer's type-role adapter. The custom terminal whitelist is
replaced with PUBLIC compiler `SyntaxFacts.IsInTypeOnlyContext` (available in4.8
and measured5.9). Classify the ORIGINAL named slot; normalize complete wrappers
only to apply policy. Calling the classifier on a complete array/stackalloc wrapper
would let GetStandaloneExpression promote it into a value expression, losing its
role. No duplicate array/stackalloc type-position switch is required.

Wrapper normalization includes ref/scoped, tuple/function-pointer type slots and
alias-qualified heads. Explicit-interface headers establish independent facts/
decision regions: method type parameters can capture a name in the return/body
but are not in scope in the interface-specifier portion. The same namespace
selector, prefix/identity checks, caches and existing traversal remain unchanged.

New eligible type slots include operator/conversion returns, ref/tuple/function-
pointer, foreach, as/sizeof/stackalloc, explicit lambda returns, primary-constructor
bases, explicit-interface members and declaration/recursive patterns. No expression,
cast, pattern, lambda or extension-call transformation is added. Existing policies
still retain unprotected casts, bare type/is patterns, cref/incomplete/__refvalue,
typed From/Join, source-observable subtrees and generic-containing segments.

A review found that missing AliasQualifiedName normalization could hide an enclosing
policy under `global::Box<T>`. Six warm-cache failures were reproduced (cast/query/
containing-owner/bare-pattern/tuple-wrapped roles), then fixed with the shared alias
climb. All six pass accepted A; two new interface-positive controls fail A. Exact B
source was restored after this comparison. A deliberate oracle control also exposed
missing legacy-is observation; the role oracle now snapshots that binding along
with modern pattern facts, new type slots and implemented interface members.

Fresh actual saved-input AppService ABBA, accepted A vs B, both `structural` /
Roslyn5.9, two processes each:

| Mean | Accepted A | B | Change |
|---|---:|---:|---:|
| Elapsed | 74.351s | 74.620s | +0.36% |
| Allocation | 13,744,524,268 B | 13,852,904,588 B | +0.79% |
| Peak working set | 1,641,897,984 B | 1,636,218,880 B | −0.35% |
| Generated bytes | 22,916,090 | 22,569,018 | −1.51% |

Remaining type-name qualification: **21,280 → 12,917 (−8,363 / −39.30%)**.
Checkpoint/B differs ONLY by 8,363 type-name events in951files; every other category
is unchanged. Raw `global::`67,591→59,228; total syntax117,496→109,133. Both
comparisons zero parse errors/unclassified residuals; baseline replay byte-identical
to accepted A across2,301files. Two-sample means do not establish significance or
statistical neutrality. No fresh Roslyn timing/TypeSpec compilation, per-role
causal cost isolation or historical-time substitution is implied.

**358 focused / 3,302 core / 2,509 client** passed; official scoped/unfiltered
generation passed (full652.45s), **956 Spector /10skipped**, Sample builds/host zero
tests. A and B SDKs independently passed three-TFM Rebuild/native csc/ApiCompat1.5.0,
zero warnings/errors. 2,186test/2,677SDKfiles hash-restored; production matches final
full-suite/measured source. Same fixed-project-flags and other retained boundaries.

Receipts: `.pi/benchmarks/provider-reducer-namespace-b/RESULTS.md`, `summary.json`,
TRX/logs/source/payload manifests, `full/`, `full-generation/`.
**User accepted B and authorized C**, using B's exact measured payload as the
reference. No commit/push/default rollout or automatic C promotion is authorized.

## 16. Namespace experiment C — accepted checkpoint

C replaces blanket normal-invocation/recognized constructor-argument exclusion
with lazy ORIGINAL-call source-observability facts. A shared method-definition
metadata summary proves absence of CallerArgumentExpression without GetOperation;
CAE-bearing calls inspect actual omitted DefaultValue/parameter-name argument maps.
Reduced extension receiver Value.Syntax is protected, explicit capture-text overrides
and unrelated uncaptured arguments can reduce. All enclosing call frames participate
before namespace caches, preserving nested captured source. Unknown/dynamic/missing/
expanded mappings retain qualification. No extra body visitor or operation-tree scan.

Hard source contexts and conditional TARGET call/argument subtrees remain excluded:
header/type-only invariance does not prove alternate receiver-local types bind the
same call/CAE contract. New C prefix edits cannot remove physical line breaks and
shift CallerLineNumber. Existing namespace selector, binding/provenance/role/trivia/
configuration proofs and A's terminal/argument-preserving rendering remain reused.
Explicit method type-argument namespace spelling can reduce; no arguments are inferred
or removed. Other cleanup families remain unchanged; D–F are not implemented here.

Fresh actual saved-input AppService ABBA, accepted B→C, bothstructural/Roslyn5.9,
two processes each, immutable baseline replay matches all2,301files:

| Mean | Accepted B | C | Change |
|---|---:|---:|---:|
| Elapsed | 74.746s | 76.618s | +2.50% |
| Allocation | 13,895,511,152 B | 13,927,340,632 B | +0.23% |
| Peak working set | 1,640,622,080 B | 1,662,398,464 B | +1.33% |
| Generated bytes | 22,569,018 | 22,445,322 | −0.55% |

Remaining type-name gap **12,917→9,880 (−3,037/−23.51%)**; rawglobal59,228→56,188.
DirectB/C comparison has3,040type-name events only in734files, no reverse/other
category changes. Decomposition against savedRoslyn falls by3,037, not necessarily
additive across different baselines. Both comparisons zero parse/unclassified
residuals. Two-sample means are not significance/statistical-neutrality claims;
more work at more cost, no fresh Roslyn timing/TypeSpec compilation or historical-
time substitution. No per-helper causal cost isolation.

**394focused /3,338core /2,509client** passed; official scoped/unfiltered generation
(full654.44s),956Spector10skip;Sample builds/hostzero tests. Both outputs independent
native3TFMRebuild/ApiCompat1.5.0PASS0warnings/errors;2,186test/2,677SDKhashrestored;
exact production source matches full-suite/measured build. Captured/unknown/call-
state/named/partial/delegate/constructor/extension/lambda/conditional/line-number
controls plus implicit-argument negative oracles preserved. Static review found no
confirmed unsafe rewrite; advisory review is separate from executed gate evidence.

Receipts `.pi/benchmarks/provider-reducer-namespace-c/RESULTS.md`,summary.json,TRX,
source/binary/output manifests,full/,full-generation/. **User accepted C and
authorized D**, using this exact measured payload; no commit/push/default rollout
or automatic D promotion is authorized.

## 17. D opportunity screen — no AppService document-veto targets

Before introducing additional conditional scope proof, a read-only inventory of
accepted C's saved AppService output used the existing ProviderConditionalSyntax
and supported parsed variants. Of2,301generatedfiles,596containconditionalbranches.
All596pass current header/body eligibility AND type-only document eligibility;
none has a generic local function in any supported variant. No generated target
document in this corpus is blocked by the D document/scope-veto refinement.

Recommendation: defer this part of D rather than add unmeasurable proof machinery.
This is a saved-output syntax opportunity screen, NOT a new generation/benchmark
or universal claim about other SDK/custom/shared sources. No production code was
changed; accepted C source hashes remain exact. The explicit NUnit diagnostic was
archived under `.pi/benchmarks/provider-reducer-namespace-d/` and removed from normal
test discovery. No unnecessary full suites/regeneration/timing were rerun.

Conditional CALL capture protection and inactive-branch text remain separate
restrictions; do not relax either based on this document-eligibility result.
Receipts: `namespace-d/conditional-inventory.json`, `inventory.log`, archived test,
`RESULTS.md`. **User deferred D, not dropped: revisit during a future authorized
full regeneration over broader SDK/custom/shared sources.** User subsequently
authorized E separately; no full regeneration is implied.

## 18. E feasibility screen — one inactive type prefix, already at Roslyn parity

User authorized E against accepted C. A read-only saved AppService syntax inventory
found2inactive `global::` occurrences across628disabled-trivia leaves in596conditional
files (2,301files total). Only1is grammar type-only and survives a conservative
source-ancestor/nongeneric screen: BinaryData construction in GetUtf8Bytes's NET9
branch. The other occurrence participates in a static receiver and is not in scope.
The full constructor return line is byte-identical in saved Roslyn and C, so the
one screened site does not contribute to the current9,880first-category gap.

Independent architecture review supports only a bounded initial slice with explicit
all-variant scope/lookup bridging, writer provenance, source/caching safeguards and
one coordinated structured disabled-trivia emission. Alternate nodes are not bound
occurrences in the original semantic model; generic construction cannot be guessed
from metadata. No blind alternate-root substitution or chained source rewrites.

Recommend defer E production architecture for a broader corpus rather than add this
machinery for one site already at Roslyn parity. No production change/new generation/
timing/suite/SDK mutation occurred. Exact accepted-C Core/src hashes remain unchanged.
These counts are syntax-screen overapproximations, not validated reducible sites.
The diagnostic's first build used an absent assembly path; corrected local references,
retry exited0. Receipts `.pi/benchmarks/provider-reducer-namespace-e/{RESULTS.md,
ARCHITECTURE.md,summary.json,inactive-inventory.json,inventory-retry.log}`.
**User deferred E, retaining its design/inventory for a broader corpus, and
separately authorized F.** No full regeneration is implied.

## 19. F boundary-comment preservation — accepted checkpoint

F permits only caller-owned boundary comment trivia through the shared descriptor.
Describe defaults conservative; one production opt-in allows four ordinary/XML
comment kinds wholly outside name.Span, because BOTH existing rewrite paths restore
that original occurrence's complete outer trivia. Internal significant trivia,
directives and diagnostics remain vetoes. Binding/provenance/path/arity/role/source
checks still precede caches; generic plans render current arguments and nongeneric
caches strip boundaries. Two production files only, no new visitor or cleanup family.

Ownership is per recorded reference. An argument comment internal to an outer name
still retains that outer qualifier, while an independently recorded child can shorten
if the same comment is its boundary trivia and is restored exactly. No blanket
permission to delete/move argument comments. Default selector callers remain strict.

Fresh matched actual AppService saved-input ABBA C→F, bothstructural/Roslyn5.9:

| Mean | Accepted C | F | Change |
|---|---:|---:|---:|
| Elapsed | 86.335s | 84.585s | −2.03% observed |
| Allocation | 13,937,183,976 B | 13,934,880,536 B | −0.017% |
| Peak | 1,662,412,800 B | 1,666,248,704 B | +0.23% |
| Output bytes | 22,445,322 | 22,362,013 | −0.37% |

Remaining type-name gap9,880→**7,550 (−2,330/−23.58%)**; directC/F2,330type-name
normalization events ONLY,859changed/1,442identicalfiles. Rawglobal56,188→53,858;
all other saved-Roslyn categories unchanged, zero parse/unclassified residuals.
Two-process means are not confidence/significance or proven causal speedup; more
coverage is not a same-output algorithm comparison. No fresh TypeSpec/Roslyn timing
or historical absolute-time comparison. C replay byte-matches accepted2,301files.

**411focused /3,355core /2,509client PASS**, official scoped/unfiltered generation
(full718.36s),956Spector10skip, Samplezero discoveredtests. Both outputs independent
native3TFMRebuild/ApiCompat1.5.0PASS0warnings/errors. Exact2,186test/2,677SDK restored;
production hashes match suites/measuredbuild. No existing regression expectation
changed; corrected added child fixture provesCretention/Fshortening after actual
ownership assertion. Supplementary2,301file/fiveconfiguration check (11,505paired
parses) confirms byte-exact significant trivia and exact line-ending sequences.
Design/final static reviews found no concrete blocker.

Receipts `.pi/benchmarks/provider-reducer-namespace-f/{RESULTS.md,summary.json,
full-generation/,final-focused-retry.log,child-fixture-base.log,trivia-inventory.json}`.
**User accepted F as the current checkpoint**, gap7,550; source, measured binaries
and output files reverified in namespace-f/accepted-checkpoint.json. No commit/push
or default rollout; D/E remain deferred and retained.

## 20. Static-receiver qualification — accepted checkpoint

Subsequent user-approved experiment shortens only a recorded TYPE receiver and
preserves its complete member/call/arguments. Same existing traversal; shared
canonical descriptor/selector, explicit expression mode and actual-position lookup
facts rather than declaration-wide decisions. Original and one selected speculative
receiver must bind to the same named construction/nullability, not equal value type.
Supported static member/callee unchanged; unknown/dynamic/conditional/source-sensitive
contexts remain conservative. Real expression-node rendering, no text-edit chain or
whole-call speculative model. Raw contextual root exposure retains qualification;
escaped terminal tokens remain exact, including compatibility with C#14 field syntax.

Fresh matched AppService ABBA acceptedF→candidate, bothstructural/Roslyn5.9:
static25,478→**11,733 (−13,745/−53.95%)**; type7,550 and all other saved-Roslyn
category counts unchanged. Direct14,048static-only events/911changed1,390samefiles;
rawglobal53,858→39,810. Different-baseline normalization decomposition is not additive;
no distinct-symbol or exact303site claim. Both comparisons zero parse/unclassified.

Mean elapsed85.034s→88.409s(+3.97%), allocation13,801,459,672→14,178,262,252B(+2.73%),
peak1,663,766,528→1,676,615,680B(+0.77%),bytes22,362,013→21,996,187(−1.64%).
Two processes each, not significance/same-output speed comparison/freshRoslyn timing.
Coverage has a measurable cost, not a speedup over F's smaller workload.

**444focused /3,388core /2,509client PASS**, official scoped/unfiltered736.32s,
956Spector10skip, Samplezero discoveredtests. Both outputs independent native3TFM
Rebuild/ApiCompat1.5.0PASS0warnings/errors;2,186test/2,677SDK restored exactly. AcceptedF
byte replay/source/suite/measured identities verified. Actual-rewriter5.9 field
before/after and2,301file/fiveconfig trivia/endings checks pass (11,505pairedparses).

Final review found a genuine field parser hole despite correct constructed-AST
binding. Old pipeline stopped before unfiltered/measurement, faithful valid-original
repro CS1061 recorded, general contextual-root guard fixed it, independent closure
review and fresh final gates passed. Interrupted receipts preserved. Fixture repairs
(metadata availability/forced alias/original await validity) are separately disclosed;
only2approvedstatic-only retention expectations changed after exactF8FAIL evidence.

Recommendkeepif+3.97%time/+2.73%allocation acceptablefor53.95%staticgapreduction.
**User accepted static qualification as the current checkpoint**, source/binary/output
identities reverified in accepted-checkpoint.json; user separately authorized the
expression-parentheses experiment. No this, commit/push/default rollout. Receipts `.pi/benchmarks/provider-reducer-static-receiver/RESULTS.md`
and summary/source/binary/output/parser/trivia/restoration artifacts.

## 21. Non-reassociating expression parentheses — accepted checkpoint

User authorized parentheses after accepting static qualification. Same rewrite
visitor handles atomic direct chains, finalpayload/originalparent grammar, exact
all-delimiter trivia transfer and per-delimiter source guards. Conservative syntax/
association only; cast operands, receivers/targets, defaults/casts/unknown payloads,
optional defaults/patterns/interpolation/conditional documents retain. No semantic
reassociation, this or other cleanup family. Shared legacy precedence/token facts
are unchanged; legacy admission/text planner remains separate. Lazy original-list
relational facts avoid scans without candidates; other local trivia/subtree queries
are disclosed. Syntax-only generated cleanup no longer requires unrelated type
records, but empty records never authorize name changes and all configuration/
custom/header/diagnostic gates remain.

Fresh matched accepted-static/candidate saved AppService ABBA, bothstructural5.9:
Parentheses.Other23,414→**11,997 (−11,417/−48.76%)**, direct11,417samecategoryONLY,
941changed1,360samefiles. All other category counts EXACTunchanged; total90,021→78,604;
zero parse/unclassified. Rawglobal39,810unchanged;22,834bytes fewer.

Mean elapsed88.716s→88.797s(+0.09%observed),allocation14,047,626,852→14,100,536,684B
(+0.38%),peak1,682,599,936→1,692,583,936B(+0.59%). Two-process local means are not
significance or proof of neutrality; different work is not a same-output comparison.
No historical absolute-time/freshRoslyn/TypeSpec timing substitution.

**495focused /3,439core /2,509client PASS**, officialscoped/unfiltered739.81s,
956Spector10skip, Samplezero discoveredtests. Both independentnative3TFMRebuild/
ApiCompat1.5.0PASS0warnings/errors; exact2,186test/2,677SDK restored. Baseline replay/
source/measurement identities verified. Actual-rewriter5.9 field+parentheses composed
output parses/compiles safely. All2,301files/fiveconfigurations (11,505pairedparses)
preserve significant trivia byte-exactly and exact line-ending sequences. Independent design/implementation/closure reviews
found no final blocker, oracle weakening or missing mandatory control.

Oracle integrity corrections independently reproduced: wholeMethodoperations replace
unmapped arrow wrapper snapshots; normalize only explicitArgument.IsImplicit flag,
retain conversions/kinds/types/constants/member/operator/callee/grouping. Compiler
captures samex+yfromCapture((x+y))/Capture(x+y), so source-differencecontrol corrected
toequivalenttypeofspellings with genuinely differentcapture. Production capture
admission not widened. Sole old paren-retention assertion changed after exact-base
positive FAIL; all other accepted assertions preserved.

Receipts `.pi/benchmarks/provider-reducer-parentheses/RESULTS.md` and summary/source/
binary/output/operation/parser/restoration artifacts. **User accepted parentheses**,
identities reverified in accepted-checkpoint.json, and separately authorized bounded
this fields/properties. No methods/events expansion/commit/push/default rollout.
D/E retained.

## 22. Bounded instance `this.` data members — accepted

Same visitor/original-model proof for instance fields/properties only. Actual-position
speculation of a fresh detached identifier must match the exact original member
including nullability. Shared syntax parser facts, source/line/trivia/hidden/dynamic
checks; invariant member/type metadata caches, never lexical binding decisions.

Two independently reproduced defects corrected without weakening expectations:
attached member.Name speculation can promote back to this.Member and falsely accept
shadows; same inherited field identity can nevertheless newly emit CS9179 for a
primary-constructor parameter, breaking warnings-as-errors. Fresh root ownership and
original source-type primary-parameter metadata guard these separately. Delegates'
invocation targets remain qualified through parentheses. Methods/events excluded.

Fresh matched accepted-parentheses/candidate structural5.9 ABBA, two processes each:
ThisReceiver19,647→3,834 (−15,813/−80.49%); direct15,813same-category-only events,
548changed/1,753same files. Every other category exact unchanged; zero parse or
unclassified events. Total78,604→62,791; rawglobal39,810 unchanged;79,065bytes fewer.
Elapsed mean90.617700→91.331594s (+0.787808%observed), allocation+0.140289%,
peak+0.018153%. Two local samples do not establish significance/neutrality; different
coverage is not a same-output algorithm comparison. No historical timing reused.

573focused/3,517core/2,509client PASS; officialunfiltered738.19s;956Spector10skip;
Samplezero discoveredtests. Both native3TFMRebuild/ApiCompat1.5.0 PASS0warnings/errors.
Exact2,186test/2,677SDK restoration,142-file payload and2,301-output replay/source
identities verified. Actual5.9preview all9serialized/parser/member/CS9179-error cases
PASS; independent implementation/closure reviews no remaining concrete blocker.
Supplementary all2,301files/fiveconfigurations (11,505pairedparses) PASS after timing:
significant trivia byte-exact, line-ending sequences exact; not semantic binding proof.

Receipts `.pi/benchmarks/provider-reducer-this-receiver/RESULTS.md`, summary.json and
source/binary/output/parser/restoration artifacts. The pipeline wrapper exit1 was a
summarizer focused-log filename typo AFTER successful substantive gates; corrected
report assertions pass, original error retained. **User accepted**; source, payload
and all2,301 outputs reverified in accepted-checkpoint.json. No next family,
commit/push/default rollout/full SDK regeneration authorized. D/E retained.

## 23. Conditional syntax-only parentheses — accepted

One production file, existing visitor and cached supported-configuration roots.
Only common active-source grammar-preserving parentheses outside enclosing call/
source-protected contexts. Every variant proves exact original span/subtree/direct
parent role, ancestor exclusions, grammar against FINAL visited payload, trivia/
visibility and variant token boundaries. Original output only; no root installation
or per-variant semantic models. Conditional call/static/this permissions unchanged.
No new cast/default/unary/receiver grammar, reassociation or inactive branch edits.

Fresh acceptedThis/candidate matched structural5.9 ABBA,2processeseach:
Parentheses.Other11,997→2,443 (−9,554/−79.6366%); direct9,554samecategoryONLY,
596changed/1,705samefiles. Allothercategoriesexactunchanged;0parse/unclassified.
Totalgap62,791→53,237;rawglobal39,810unchanged;19,108bytes fewer.
Mean87.410772→88.051617s (+0.733142%observed), allocation14,276,517,028→
14,421,715,464B (+1.017044%),peak1,698,285,568→1,695,875,072B (−0.141937%).
Two-process local means are not significance/neutrality proof; changedcoverage is
not a same-output algorithm comparison. No freshTSP/historicaltiming substitution.

606focused/3,550core/2,509client PASS; officialunfiltered715.08s;956Spector10skip;
Samplezero discoveredtests. Independentbothnative3TFMRebuild/ApiCompatGA1.5.0
PASS0warnings/errors; exact2,186test/2,677SDK restoration. All142payloadfiles and
2,301outputs/sourceidentities replayexact; baselineacceptedThis matches. Actual5.9
27rewrites/135pairedconfigurationcompiles+operationgraphs PASS; all2,301files×5configs
11,505pairedsignificant-trivia/line-ending checks PASS aftertiming. Design/actual-code
source reviews no remaining blocker; not build/test substitutes.

One old conditional common-arrow retention policy assertion updated ONLY after
samefixture desiredpositive1FAIL on exactacceptedThis baseline; disabled/custom/
header/source/inactive/target safeguards retained. Finalpayloadnamespace children,
caller-source/lines, hidden/order, noncanonicalflags, branchonlyoracle corruption,
otherheader/genericlocals/fragment gates covered.

Evidence `.pi/benchmarks/provider-reducer-conditional-parentheses/RESULTS.md`, summary
and manifests. **User accepted**; source, payload and all2,301outputs reverified in
accepted-checkpoint.json. No newfamily/commit/push/defaultrollout/fullSDKregen
implicitly authorized. D/E retained as separate deferrals.

## 24. Whole-type XML cref — accepted

Three production files, existing traversal/finalserialization, structured-doc opt-in.
Writer-proven canonical whole-type nongeneric named crefs/owners in eligible
unconditionaldocs only. Exact original named target and per-occurrence source/
provenance/trivia/line/visibility checks; shared candidate plans with qualified
fallback. Parse actual prospective XML, detach complete parser-selected CrefSyntax,
require original-position exact target including nullability/no candidates. No
binding-decision cache, alternateDocroot/stringrewritechain/per-edit compilation.

Cref-specific alias grammar: alias::T is XMLIDtext, notCref; alias.T is parsed and
bound. Ordinary C# alias::T/global:: unchanged. Factory method/type collisions,
terminal escaping, unsupported/unrecorded/member/generic/conditional/inactive/array/
nullable boundaries retained. No accepted old expectations changed;35newcontrols.

Fresh acceptedconditionalParenth/candidate matched structural5.9 ABBA,2processeseach:
XmlCref9,249→3,549 (−5,700/−61.6283%); direct5,700XmlCrefONLY;895changed1,406samefiles.
Everyothercategoryexactunchanged;0parse/unclassified/reverse. Total53,237→47,537;
rawglobal39,810→34,110;236,305bytes fewer. Mean82.936580→84.302036s(+1.646386%
observed),allocation14,343,625,188→14,616,974,548B(+1.905720%),peak1,692,815,360→
1,746,944,000B(+3.197551%). Two-local-processmeans not confidence/significance/
neutrality/causality proof; differentcoverage notsame-output comparison.

641focused/3,585core/2,509clientPASS,956Spector10skip;officialunfilteredLOCAL680.58s;
Samplezero discoveredtests. Bothnative3TFMRebuild/ApiCompatGA1.5.0PASS0warnings/errors.
Actual5.9preview14wholeCrefserialization/target/outside-source/capturegraphcasesPASS.
All2,301files×5configs11,505pairedchecksAFTERtiming: ONLYactualCrefspansnormalized;
ALLsurroundingcode/XML/trivia andwhole-filelineends exact. Thisisnotwhole-document
triviabyteidentity/semanticproof. Both142payloads/all2,301outputs/sourceidentities
replayed; exact2,186test/2,677SDKsourcesandpropsrestored, SDKtrackedtreeclean.
Independentdesign/code/aliasclosure source reviews no remaining concrete blocker.

Fixture/oraclecorrections separately documented (writerimports/costties/missingrefs,
malformedarraycref/customformatter/cref-declaredtypeparamidentity). Genuine alias
coveragegap reproduced with valid dottedpositiveFAIL before adapter; unchanged
wholebinding/sourceproofs. Receipts `.pi/benchmarks/provider-reducer-cref/RESULTS.md`,
summary and manifests. **User accepted**; source, payload and all2,301outputs
reverified in accepted-checkpoint.json. No newfamily/commit/push/defaultrollout/
fullSDKregen authorized. D/E retained.

## 25. C1 attribute-name qualification/suffix — accepted

Two production files, existing visitor/original models/finalserialization. Only
canonicalrecordednongeneric attribute NAMES inunconditionalgeneratedcontexts.
Arguments remainexcludedandoriginalArgumentList reused. Wholepublicspeculative
attribute model with exactconstructor/type/nullability andfail-closedoperation
contract(orderedchildren/args/maps/conversions/implicitconstants/namedmembers).
Actualnamegrammarroundtrip; suffixescaping/Unicode/keyword checks; peroccurrence
source/provenance/line/visibility/CAEproof, metadata-onlyeligibilitycache. Unknown
shapesretain. No argument/conditional/generic/inactive/otherfamily expansion.

Fresh acceptedCref/candidate matchedstructural5.9 ABBA,2processeseach:
Qualification.Attribute5,742→817(−4,925/−85.7715%);AttributeSuffix4,926→1
(−4,925/−99.9797%). SAME4,925actualattributeNAMES,not9,850independentedits;
1067changed1234samefiles. AllothercategoriesEXACTunchanged,0parse/unclassified/
reverse. Total47,537→37,687;rawglobal34,110→29,185;233,634bytes fewer.
Mean86.330179→86.858275s(+0.611716%observed),allocation14,626,430,672→
14,800,799,144B(+1.192146%),peak1,756,737,536→1,744,484,352B(−0.697497%).
Localtwo-processmeans notconfidence/significance/neutrality/causality orsame-output
algorithmcomparison; no historical/freshTSP/freshRoslyn timing substitution.

685focused/3,629core/2,509clientPASS,956Spector10skip;officialunfilteredLOCAL705.21s;
Samplezero discoveredtests. Bothnative3TFMRebuild/ApiCompatGA1.5.0PASS0warnings/errors.
Actual5.9preview18serializedwholeAttribute/typedmetadata/outsideNAME/capturegraph
casesPASS. AFTERtiming2,301files×5configs11,505pairedchecks normalizeONLYNAMEspans:
ALLarguments/code/XML/triviaoutside andwholefilelineends exact.24625changednamepairs
=4925×5; lexicalchecknotsemanticproof/whole-docbyteidentity. Both142payloads/all2301
outputs/sourceidentities replayed;2186test/2677SDKsources/propsrestored,SDKtrackedclean.
Design/actualcodesource reviews no blocker; operationcomparer notgeneraldiagproof.

OldqualifiedObsoleteassert updatedONLYafterSAMEfixtureexactacceptedCrefdesiredpositive
1FAIL0PASS andguardedrestore;allotherprofile/nameof/static/visit/sourceanchorspreserved.
44newcontrols includecontexts/mappings/escape/capture/callerdefaults/arrays/enums/
provenance/visibility/header andstrongsamector/samecompilation/defaultmapdifferent
callerconstantcorruptioncontrol. Receipts `.pi/benchmarks/provider-reducer-attributes/RESULTS.md`,
summary/manifests. **User accepted**; source,payload,all2301outputs reverified in
accepted-checkpoint.json. BoundedC2optionaldefault experiment next; no broaderfamily/
commitpush/defaultrollout/fullSDKregen/D/Ereopening.

## 26. C2 optional-parameter defaults (accepted)

Accepted C1 baseline versus bounded direct `default(T) → default` cleanup in the
same structural visitor. One production reducer delta; original parameter symbol
and operand type must match including nullability/construction/type-parameter
identity. Optional/default metadata, supported recursive graph, declaration-owner,
unconditional document, C#7.1+, source-observation, line/trivia/token guards remain.
No whole-call model, framework patch, new traversal or argument/cast expansion.

Remaining optional typed defaults **2,310 → 0** (−100%); 248 files changed, 2,053
identical. Only this category changes; every other category count exact. Total
remaining events 37,687 → 35,377; zero parse/unclassified. Output 21,405,241 →
21,361,351 bytes (−43,890); raw `global::` unchanged at 29,185.

Fresh matched complete saved-input AppService ABBA, two processes each, both
structural/Roslyn5.9: elapsed mean 86.417750 → 87.337550 s (**+1.064365%**),
allocations 14,752,513,116 → 14,729,173,524 B (**−0.158208%**), peak working set
1,738,219,520 → 1,749,604,352 B (**+0.654971%**). Local means only, not significance,
causality, neutrality or same-output algorithm comparison; not fresh TSP/Roslyn timing.

726 focused/3,670 core/2,509 client passed; 956 Spector passed, 10 skipped. Official
unfiltered LOCAL regeneration 687.521 s; Sample zero discovered tests is not runtime
coverage. Both native3TFM Rebuild/ApiCompat GA1.5.0 passed, zero warnings/errors.
Actual Roslyn5.9/preview 20 serialized parameter/default/reflection/callee/source
cases passed. Null/Missing/DBNull remain distinct. Two anticipated nullable forms
remain typed under exact parameter/operand annotation mismatch; permanent diagnostic
and metadata controls retained, no production normalization or old accepted assertion
change. Independent design/implementation source reviews found no blocker.

After timing, 2,301 files × 5 configurations/11,505 paired checks normalize ONLY
actual parameter default-value spans: all outside code/XML/trivia and whole-file
line endings exact, not whole-document byte identity or semantic proof alone.
Closure replay verifies source/payload142/output2301/both runs, exact accepted-C1
baseline, props/test2,186/SDK2,677 restored. Full receipts:
`.pi/benchmarks/provider-reducer-optional-defaults/RESULTS.md` and `closure-replay.json`.
**User accepted: “keep”.** Fresh source/payload/output replay passed before
`accepted-checkpoint.json` recorded the new optional-defaults candidate baseline.
No next family, default rollout, commit/push, full SDK regeneration or D/E reopening
authorized.

## 27. C3 cast-type qualification (deferred, not dropped)

Accepted C2 baseline; two production files, reducer + StructuralCastTypeRules.
Cast-owned postorder proof preserves the final visited operand and cast punctuation.
Outer named heads only, original generic arguments and array/nullable wrappers;
exact complete-type detached rebinding, full cast and bounded ordinary-argument
parser certificates, original source/config/provenance/line/trivia/visibility guards.
No cast removal, reassociation, conditional policy widening or new full-tree pass.
Shared C2 graph body and original ordinary cast guard unchanged; no lexical caches.

**1,127 actual prefix changes**, 261 changed/2,040 identical files, direct taxonomy
Qualification.TypeName only. Visible remaining type-name gap **7,550 → 7,180**
(−370/−4.900662%); total remaining35,377→35,007. Exact baseline-span overlap explains
757 other prefix edits inside Cast.Default differences already folded into outer
cast/parentheses events; those casts remain. Every other category count unchanged,
zero parse/unclassified. Rawglobal29,185→28,058; bytes21,361,351→21,320,858(−40,493).

Fresh complete saved-input AppService ABBA, two processes each bothstructural5.9:
elapsed mean89.253692→91.028324s(+1.988301%), allocation14,664,309,488→14,710,036,600B
(+0.311826%), peak1,755,006,976→1,767,397,376B(+0.706003%). Local means only, not
significance/causality/neutrality or same-output algorithm comparison; not fresh TSP
or fresh Roslyn timing. Minor increments not blockers; overall perf review deferred.

771focused/3,715core/2,509client passed;956Spector passed10skipped. Official unfiltered
LOCAL regeneration691.404s; Samplezero discovered tests not runtimecoverage. Both
native3TFM Rebuild/ApiCompatGA1.5.0 passed0warnings/errors. ActualRoslyn5.9preview25
serialized type/conversion/operator/callee/argument/source/warning cases passed,
allbefore/afteremitted and7runtimepairs matched. Fivelexicalcorruptioncontrols passed.
Initial/argument-boundary/actual-code source reviews no blockers; source-only.
Oldpolicyassertions updated onlyafterSAMEfixture exactC2 desired-positiveFAIL and
guardedrestore; pattern/nameof/attribute/protected anchors andcache-order preserved.

Aftertiming2,301×5configs=11,505pairedchecks normalizeONLYouter cast-type named-head
spans: allwrappers/operands/outsidecode/XML/trivia andwholelineends exact; conditional
documentsWHOLEbyteexact.5,635changedheadpairs=1,127×5. Not semanticproof/whole-docbyte
identity. Closure replay confirmsfocused/validation/measured/currentSRC, both142-file
payloads/all2,301outputsbothruns, acceptedC2baseline exact, props/test2,186/SDK2,677
restored; SDKstatusonlyuntracked.pi. Constructorinitializers/memberreceivers/nested
argumenttypenames/conditionalcasts/unsupportedcontexts remainexcluded.

Receipts `.pi/benchmarks/provider-reducer-cast-types/RESULTS.md`, coverage-overlap.json,
summary.json andclosure-replay.json. **User deferred C3**: small visible-gap benefit
relative to observed elapsed increment. All owned candidate source/tests archived
under deferred-source/; active production restored exactly to accepted C2, with
unrelated WIP preserved. deferred-checkpoint.json records restoration. No accepted
C3 checkpoint. C4 remaining-parentheses work separately authorized; no commit/push/
defaultrollout/fullSDKregen or D/E reopening.

## 28. C4 outer-cast grouping (accepted)

Accepted C2 baseline; C3 remains deferred/absent. Production delta is cast payload
admission plus cast-only ORIGINAL delimiter visibility guard. Existing parent roles,
precedence, atomic chains/final visited payload, source/caller/trivia/token/config
proofs and cast-operand barriers unchanged. No cast removal/type-name change,
reassociation, new speculative model or extra full-tree rewrite pass.

Parentheses.Other **2,443 → 665** (−1,778/−72.779370%); total remaining35,377→33,599.
Direct1,778group-pair removals,541changed/1,760identical files. Allothercategorycounts
exact,zero parse/unclassified. Rawglobal29,185 unchanged; bytes21,361,351→21,357,795
(−3,556). Sixof1,784screenedcastgroups remain in non-admitted conditional-expression
roles;618coalesce/41other events remain separate. Countsnotprevalidation safe edits.

Freshcomplete saved-input AppService ABBA,twoeachbothstructural5.9: meanelapsed
91.620686→91.121436s(−0.544910%); allocations14,687,955,204→14,693,338,716B(+0.036653%);
peak1,762,723,840→1,754,220,544B(−0.482395%). Localmeansnot significance/causality/
neutrality/same-output algorithm comparison; not fresh TSP/Roslyn timing. Overall
performance review remainsdeferred; minorcandidate increments not blockers.

768focused/3,712core/2,509client passed;956Spector passed10skipped. Official unfiltered
LOCAL regeneration718.844s passed; Samplezero discoveredtests not runtimecoverage.
Bothnative3TFM Rebuild/GA1.5.0ApiCompat passed0warnings/errors. Correctedactual5.9:
81rewrites/405pairedconfigs,allpairs emitted,18runtimeEntryrowsmatch. Sevenlexical
corruptioncontrols passed. All2,301outputs×5configs=11,505posttimingdelimiter/source/
ASTchecks passed;8,890removedpairs=1,778×5. Onlyvisibleboundedoutercastgroup delimiter
spans normalized, allothercode/XML/trivia/castpunctuation/operandbarriers/inactive+
wholelineends exact; normalizedASTassociation/type/operand shapes equivalent. Not
standalone semanticproof/whole-docbyteidentity or arbitraryfuturedefine proof.

Initial source review found newly reachable unconditional hidden-source policy gap;
independentC2-vs-C4binarycounterexample and3permanentFAIL-before/pass-after controls
precededcast-onlyfix. Correctedreviewclosedblocker; broaderoldnoncasthidden-policy
behaviorseparatelytrackednotchanged. OldexpectationsupdatedonlyafterSAMEexactC2
fixture desired-positiveFAIL/guardedrestore; inneroperand/QName/op/trivia/config
anchors preserved. Initialone-lineprototypeevidencekeptseparatefromfinalcandidate.

Closure replay confirmsfocused/validation/measured/currentSRC,both142-filepayloads/
all2,301outputsbothruns,acceptedC2exactbaseline,props/test2,186/SDK2,677 restored;
SDKstatusonlyuntracked.pi. Originaltaskregistryunavailableonresumption; existing
process monitored withoutrestart. Finalstageexitrecords/logs/summary/native/API and
closureevidence—notmonitoralone—establishcompletion. Receipts:
`.pi/benchmarks/provider-reducer-parentheses-c4/RESULTS.md`,summary.json andclosure-
replay.json. **User accepted: “keep it and proceed to next”.** accepted-checkpoint.json
records fresh owned-source/payload/output/service/test rechecks. Unrelated SDK
OperationTemplates test WIP observed after finalclosure is recorded separately in
acceptance-replay.json and preserved untouched. New baseline C4; C5 conditional
static type-receiver qualification separately authorized. No commit/push/default
rollout/fullSDKregen/D/Ereopening. C3 staysdeferred.

## 29. C5 conditional static TYPE-receiver qualification — accepted

**All required evaluation/summary/closure gates passed. User accepted: “keep. how many are left”.**
Fresh acceptance-time identity/restoration recheck passed; `accepted-checkpoint.json`
records C5 as the latest frozen baseline. No next-family implementation permission.

C5 adds a dedicated conditional path in the existing visitor under unchanged global
header/type-only/generic-local guards. The complete outer method/constructor must
have identical active AST/raw-token positions across cached configurations. Unit
syntax invariance is cached, never occurrence binding/lexical acceptance. Original
models, exact constructed receiver/member/callee/nullability identity, final detached
speculation, recorded provenance, visibility/token/parser/contextual-field/cast and
all original ancestor explicit-call source observations remain mandatory. Implicit
foreach collection spans remain opaque across lambda ancestry; unrelated loop-body
sites may reduce. Await/deconstruction and other hard source contexts stay bounded.
No global source-flag relaxation, new rewrite pass or per-edit compilation. C4
parentheses/cast-only visibility rules unchanged; deferred C3 helper absent.

Fresh complete saved-input AppService generation, both structural/Roslyn5.9, frozen
C4 non-core payload reused; only core DLL/PDB differ:

| Metric | Accepted C4 | C5 | Observed change |
|---|---:|---:|---:|
| Static-receiver residual events | 11,733 | 6,045 | −5,688 / **−48.47865%** |
| Total residual events | 33,599 | 27,911 | −16.92908% |
| Elapsed mean | 86.513 s | 88.896 s | **+2.75395%** |
| Allocated bytes mean | 14,697,696,748 | 14,961,065,768 | +1.79191% |
| Peak working-set mean | 1,747,759,104 | 1,757,675,520 | +0.56738% |
| Generated bytes | 21,357,795 | 21,123,347 | −234,448 |

Direct C4→C5: **7,103 prefix edits**, 596 changed/1,705 unchanged files, static-receiver
qualification only. Every other residual category is unchanged; zero parse and
unclassified events. Prefix shortenings are not all eliminated Roslyn residuals:
some shorter relative qualifiers remain different from Roslyn and outer categories
fold inner differences. Raw elapsed ABBA: B85.5624/C89.0289/C88.7624/B87.4639s.
Two independent processes each do not establish significance, causality or runtime
neutrality; changed coverage is not a same-output comparison. Not fresh TypeSpec
compilation or Roslyn timing. Overall performance review remains deferred; C3's
explicit coverage/cost deferral still stands.

Validation: **812** focused/45 C5 controls; full **3,756** core/**2,509** client;
official unfiltered LOCAL **694.134s**; Spector **956 passed/10 skipped**. Sample
regeneration succeeded, zero tests discovered—not runtime assertion coverage.
Actual5.9/preview consumer: 117 rows (114 valid/3 diagnostic controls), 608 valid
paired-configuration comparisons +16 diagnostic checks; 57 runtime-entry rows match.
Independent actual-source review found no confirmed blocker. Both native Rebuilds
and GA1.5.0 API checks passed netstandard2.0/net8.0/net10.0, **0 warnings/errors**.
Post-accounting proof: 2,301×5=11,505 paired parses /7,103×5=35,515 prefix-pair checks;
outside actual prefixes, member/call/argument/construction spelling, XML/trivia,
inactive text and line endings exact with visible-prefix and normalized AST checks.
Eight lexical corruption controls passed. This is not standalone semantic proof or
whole-file byte identity.

Accounting initially exposed 40 partial-qualification gaps in 24 files. A separate
C5 diagnostic classifier reproduced the gap, then added a bounded name-only-prefix
rule for matching simple-member receiver roles; original27+new10 self-tests passed.
Independent assessment checked all40/200 configuration cases against Roslyn/C4/C5.
Accepted C4's complete event ledger and the direct C5→C4 ledger remain **byte-exact**;
only those40 categories changed, no spans/texts/configurations or generator outputs.
All original evidence/classifier preserved. This accounting-only change invalidated
no successful generation/native gates; affected accounting/corpus proof was rerun.

Final closure authenticates reviewed/focused/consumer/validation/measured/current
source identity, both142-file payloads, all2,301 outputs in both runs, exact accepted
C4 fresh output replay, props restored, 2,186 TestProjects/launch and2,677 service
files restored. The common current SDK native/API context is recorded/checked for
both variants separately from immutable historical C4 payload/archive provenance.
No new SDK worktree/reset or claim to use the historical native checkout.

Receipts: `.pi/benchmarks/provider-reducer-conditional-static-receiver/RESULTS.md`,
`summary.json`, `closure-replay.json`, `accounting-assessment.json`,
`accounting-verification.json`, `accepted-checkpoint.json`. **KEEP accepted** after
fresh identity recheck; no automatic commit/push/default rollout/full SDK generation/C6 work.

## 30. Independent C6–C12 experiments against frozen C5

The user authorized independent evaluation without intermediate decisions. C6 was
not cleared due to reproduced diagnostic loss. C7 passed full gates and removed
2,638 `ThisReceiver` events across 714 files. C8, C9 and C10 passed full gates but
made **zero saved-corpus edits**; their changed-target corpus checks are vacuous.
C11 (predefined optional-null casts) and C12 (bounded int conjunction-pattern
grouping) also passed full validation/closure with **zero saved-corpus edits**;
broader constructor casts were not cleared, and C12 keyword-array/optional-default
subfamilies were not implemented. The batch is concluded; the user subsequently
**deferred C7 because of its observed time cost**. None is accepted or combined.
Complete Core source/tests were restored to C5 before the separately authorized
correctness work in §31. For exact scope, measurements, validation, known inherited
C5 defects and guarded restoration receipts, see
`.pi/benchmarks/provider-reducer-batch-c6-c12/{RESULTS.md,PLAN.md,PROGRESS.md,results.json}`
and `C6`–`C12/RESULTS.md`. Local ABBA measurements use two samples per variant and
are not significance, causality or runtime-neutrality proof. Historical C5 remains
the common frozen baseline; C3 and namespace D/E remain separately deferred.

## 31. C5 handler/cref correctness correction — accepted baseline

The user separately authorized repairing implicit interpolated-handler caller-source
capture and recorded whole-type-cref hidden-diagnostic loss. The repair adds the
shared original-call interpolation observation and conservative original-tree cref
import/diagnostic certificate, preserving generated classification. Import-sensitive
optional defaults require import independence or a proved surviving declaration;
pre-order whole-default decisions prevent newly vetoed erasure from exposing latent
child rewrites. Originally ineligible defaults retain independent child traversal.

Final validation: **854 focused, 3,798 Core, 2,509 client**, official unfiltered
LOCAL regeneration, **956 Spector passed / 10 skipped**, actual Roslyn 4.8/5.9
runtime/diagnostic/XML/default-metadata controls, concurrent shared-owner controls,
exact fresh frozen-C5 replay, native three-TFM/GA AppService 1.5.0 API checks,
byte-identical native emitted XML, **11,505 corpus source-proof parses**, and full
SDK/TestProjects/package restoration/closure. Sample regeneration discovered zero tests.

The conservative certificate restores **5,700 cref qualifications across 895 files**:
saved residuals **27,911→33,611**, cref residuals **3,549→9,249**. No other saved
family changes; handler/C2 correctness changes have non-vacuous synthetic evidence
but no direct changed-target events here. Retention does not prove each withheld
cref reduction individually changes final SDK diagnostics.

Two local ABBA samples per variant: mean generation **97.546→108.446 s (+11.17%)**,
allocation **+2.92%**. These are observations, not causal/significance evidence.
The user confirmed these correctness fixes are required; corrected C5 is now the
comparison baseline. The observed cost and restored gap are separate optimization
concerns, never justification to retain or reintroduce the bugs.

Acceptance receipt: `.pi/benchmarks/provider-reducer-c5-correctness/accepted-checkpoint.json`.
Immutable validation receipt/report (recording their pre-acceptance status):
`.pi/benchmarks/provider-reducer-c5-correctness/{corrected-checkpoint.json,RESULTS.md}`.
Historical C5 remains immutable; the working tree holds the authorized repair.
**Baseline acceptance does not authorize optimization, commit/push, default enablement,
full SDK regeneration or C7/deferred-candidate adoption.** Bounded validation is not a theorem for every
inherited C5 family or arbitrary analyzers.
