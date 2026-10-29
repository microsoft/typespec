# Provider reducer: current draft status

The accepted prototype checkpoint is **C9**. `TYPESPEC_PROVIDER_REDUCER=structural` enables compiler-backed structural reduction; Roslyn remains the default. The older `true` provider prototype is retained for comparison. Writer grammar/default-emission fixes apply in both modes. This remains a draft, not a default rollout or complete Roslyn-simplifier replacement.

## Applied rules

- Record original writer type identities/spans and whole-type cref provenance. Share original-compilation facts and integrate reduction with member cleanup in one rewrite traversal and final serialization; uncertain cases retain their spelling rather than fall back to Roslyn.
- Shorten supported declaration/type names, namespace prefixes and aliases, including constructed generic heads and nested/array/nullable forms where certified. Conditional documents retain configuration/header/type-scope guards.
- Shorten supported static type receivers, including the bounded conditional-static certificate; this does not generally remove a complete member receiver.
- Remove certified field/property `this.` receivers with binding/conversion/source-observation guards. General method-call receivers remain outside that rule.
- Reduce certified attribute names/qualification and suffixes without rewriting attribute arguments.
- Reduce recorded whole-type XML crefs with serialized binding and import/diagnostic certificates, including C9's immediate-namespace permission. Exception provenance and broader imported/ancestor cases are not silently expanded.
- Simplify eligible optional-parameter defaults using import-use witnesses; emit valid `default(T)` forms where the writer must preserve a typed optional default.
- Remove certified expression parentheses, including conditional/statement and bounded cast-payload cases, while retaining grammar/context, trivia/visibility, caller-source and conversion safeguards. Assignment-expression statements remain legal unparenthesized C# statements.

C3 cast-type qualification, C6 `nameof`, C7 method-call `this`, and C10 SDK-shaped generic inference are **not included as accepted enhancements**. The newer cast investigation is also not included.

## Saved AppService diff gap

Same saved AppService input and saved Roslyn 5.9 reference, **2,301 emitted files**. Counts are deduplicated syntax-taxonomy events, not Git lines or independent edits.

| Checkpoint | Residual events |
|---|---:|
| Initial structural slice | 165,725 |
| Current accepted C9 | 29,336 |
| Reduction | **136,389 (82.3%)** |

The earlier combined/legacy provider prototype had 147,326 residual events; that is a different starting rule set, not the initial structural checkpoint. Rejected/deferred experiments are excluded from the current count. C9 alone removes 4,275 cref events across 894 files; its remaining cref count is 4,974.

## Remaining AppService pattern groups

| Potential group | Events |
|---|---:|
| Cast/generic-argument type qualifications | 7,050 |
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
| **Total** | **29,336** |

Important concentrations: 4,798 events are interface/model-argument qualifications in 2,399 `IPersistableModel<T>` casts; static receivers include 2,279 Optional checks, 1,047 ModelReaderWriter uses, 1,047 serialization-context uses and 1,254 JSON fallback calls. Exception crefs account for 2,574 events. Overall, 20,064 events occur in serialization files; 18,871 occur in conditional documents, but only 1,255 are inside branches. These cross-cuts overlap and must not be added together. Counts are investigation opportunities, **not safe-edit estimates** or authorization to revive deferred rules.

## Validation and limits

The accepted C9 source epoch passed 75 targeted and 869 focused tests, 3,813 Core and 2,509 client tests, plus official unfiltered LOCAL/Spector (956 passed, 10 skipped). The sample discovered zero tests and is not runtime coverage. Source proof covered all 2,301 files in six configurations (27,612 parses), with independent UTF-8/BOM/UTF-16 reconstruction. Semantic output-consumer checks matched 25,650 bindings, complete ordinary/unfiltered compiler/emit diagnostic multisets and 90,444 independently projected locations; 23 controls passed.

Authentic original reconstruction uses 2,699 documents and 20 references. The explicit output-consumer view has 2,563 documents after symmetrically collapsing 136 original same-name/source/metadata-identical duplicate IDs. Original binding/diagnostic anchors run before that construction. Its existing failed emits are diagnostic evidence, not positive XML/runtime proof.

A successful candidate-only net10 build verified actual GA AppService 1.5.0 API compatibility and byte-identical whole emitted XML against authenticated saved accepted-baseline XML. All 2,677 SDK and 2,186 local/launch files were exactly restored. No fresh baseline build was required. Fresh netstandard2.0/net8.0 validation and comparative profiling remain deferred. The approximately 119-second C9 whole-generation run is a rough single-run observation, not a reducer-only measurement or comparative speed claim.

Earlier architecture and measurement histories remain in [ProviderReducerPrototype.md](ProviderReducerPrototype.md) and [StructuralTypeNameReduction.md](StructuralTypeNameReduction.md); their historical scope limits and measurements are not current rollout claims. Large captured SDK inputs, outputs and local validation logs are intentionally not checked in.
