# Provider reducer: current draft status

The accepted prototype checkpoint is **C9 plus the SDK-shaped cast/interface qualification slice**. `TYPESPEC_PROVIDER_REDUCER=structural` enables compiler-backed structural reduction; Roslyn remains the default. The older `true` provider prototype is retained for comparison. Writer grammar/default-emission fixes apply in both modes. This remains a draft, not a default rollout or complete Roslyn-simplifier replacement.

## Applied rules

- Record original writer type identities/spans and whole-type cref provenance. Share original-compilation facts and integrate reduction with member cleanup in one rewrite traversal and final serialization; uncertain cases retain their spelling rather than fall back to Roslyn.
- Shorten supported declaration/type names, namespace prefixes and aliases, including constructed generic heads and nested/array/nullable forms where certified. Conditional documents retain configuration/header/type-scope guards.
- Shorten supported static type receivers, including the bounded conditional-static certificate; this does not generally remove a complete member receiver.
- Shorten recorded interface heads and enclosing SELF-model arguments inside retained `((IPersistableModel<T>)this)` call receivers. Require stable owning methods, an independent parameter import-use witness, exact composed-type binding and cast/receiver parser proofs; retain foreign model arguments and varying/source-observable/hidden cases.
- Remove certified field/property `this.` receivers with binding/conversion/source-observation guards. General method-call receivers remain outside that rule.
- Reduce certified attribute names/qualification and suffixes without rewriting attribute arguments.
- Reduce recorded whole-type XML crefs with serialized binding and import/diagnostic certificates, including C9's immediate-namespace permission. Exception provenance and broader imported/ancestor cases are not silently expanded.
- Simplify eligible optional-parameter defaults using import-use witnesses; emit valid `default(T)` forms where the writer must preserve a typed optional default.
- Remove certified expression parentheses, including conditional/statement and bounded cast-payload cases, while retaining grammar/context, trivia/visibility, caller-source and conversion safeguards. Assignment-expression statements remain legal unparenthesized C# statements.

Historical C3 cast-type qualification, C6 `nameof`, C7 method-call `this`, and C10 SDK-shaped generic inference remain **excluded**. The accepted SDK-shaped cast slice is a separate narrow certificate, not restoration of C3 or cast removal.

## Saved AppService diff gap

Same saved AppService input and saved Roslyn 5.9 reference, **2,301 emitted files**. Counts are deduplicated syntax-taxonomy events, not Git lines or independent edits.

| Checkpoint | Residual events |
|---|---:|
| Initial structural slice | 165,725 |
| Accepted C9 (historical) | 29,336 |
| Current accepted C9 + SDK-shaped casts | 25,726 |
| Reduction | **139,999 (84.5%)** |

The earlier combined/legacy provider prototype had 147,326 residual events; that is a different starting rule set, not the initial structural checkpoint. Rejected/deferred experiments are excluded from the current count. C9 alone removes 4,275 cref events across 894 files; its remaining cref count is 4,974. The accepted cast slice removes another **3,610 qualification events in 1,805 casts across 600 files**, leaving every other family unchanged.

## Remaining AppService pattern groups

| Potential group | Events |
|---|---:|
| Cast/generic-argument type qualifications | 3,440 |
| Static helper/type receiver qualifications | 6,045 |
| XML cref qualifications | 4,974 |
| Method-call `this.` receivers | 3,834 |
| Qualified `nameof` operands | 2,399 |
| Complete member/type receivers | 1,678 |
| Attribute qualifications | 817 |
| Factory `(T)default` casts | 784 |
| Expression parentheses | 665 |
| Explicit generic call arguments | 560 |
| Object-creation type qualifications | 496 |
| Small keyword/pattern/null/default/declaration remainder | 34 |
| **Total** | **25,726** |

The remaining interface/model-argument inventory has 1,188 qualification events in 594 `IPersistableModel<T>` casts. Static receivers still include 2,279 Optional checks, 1,047 ModelReaderWriter uses, 1,047 serialization-context uses and 1,254 JSON fallback calls. Exception crefs account for 2,574 events. These counts are investigation opportunities, **not safe-edit estimates** or authorization to revive deferred rules.

## Validation and limits

The current accepted cast source epoch passed 11 policy regressions, **3,824 Core and 2,509 client tests**, plus official unfiltered LOCAL/Spector (**956 passed, 10 skipped**). The sample discovered zero tests and is not runtime coverage. Source preservation covered all 2,301 files: strict decoding/byte comparison, with the 600 changed files parsed in six configurations and independently reconstructed through UTF-16 deletions with exact UTF-8/BOM/trivia parity; 49 source controls passed. Semantic checks matched **10,830 cast/full-method-operation comparisons**, complete ordinary/unfiltered compiler/emit diagnostic multisets, **752,232 independently projected locations and 619,488 source-syntax records**; 48 controls passed. C9's earlier 25,650 cref-binding comparisons remain historical baseline evidence, not newly rerun cast comparisons.

Authentic original reconstruction uses 2,699 documents and 20 references. The explicit output-consumer view has 2,563 documents after symmetrically collapsing 136 original same-name/source/metadata-identical duplicate IDs. Original binding/diagnostic anchors run before that construction. Its existing failed emits are diagnostic evidence, not positive XML/runtime proof.

A successful candidate-only net10 build verified actual GA AppService 1.5.0 API compatibility and byte-identical whole emitted XML against authenticated saved accepted-baseline XML. All 2,677 SDK and 2,186 local/launch files were exactly restored. No fresh baseline build was required. Fresh netstandard2.0/net8.0 validation and comparative profiling remain deferred. The approximately **113-second** current whole-generation run (historical C9: approximately 119 seconds) is a rough single-run observation, not a reducer-only measurement or comparative speed claim.

Earlier architecture and measurement histories remain in [ProviderReducerPrototype.md](ProviderReducerPrototype.md) and [StructuralTypeNameReduction.md](StructuralTypeNameReduction.md); their historical scope limits and measurements are not current rollout claims. Large captured SDK inputs, outputs and local validation logs are intentionally not checked in.
