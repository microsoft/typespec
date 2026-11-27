# Provider reducer: current draft status

Opt-in compiler-backed structural reduction through C9, SDK-shaped cast/interface qualification, both Optional.IsDefined refinements, bounded cref import activation/exception provenance, and branch-local static invocations. Enable with `TYPESPEC_PROVIDER_REDUCER=structural`; **Roslyn remains the default**. The older `true` prototype remains for comparison. This is a draft, not a default rollout or complete Roslyn replacement.

## Architecture and applied rules

Original writer type identities/spans and whole-type-cref provenance feed shared original-compilation facts, one rewrite traversal and final serialization. Unsupported or uncertain cases retain their spelling; there is no Roslyn fallback, per-edit production compilation or occurrence-acceptance cache.

- Supported declaration/type qualifications, namespace prefixes and aliases, including certified constructed/nested/array/nullable and conditional forms.
- Static type receivers; field/property `this.` receivers with binding/conversion/source guards, not general method-call `this` removal.
- Retained `((IPersistableModel<T>)this)` receivers: shorten recorded interface heads and enclosing SELF-model arguments only, preserving exact composed-type binding, import witnesses and parser/source guards. No cast removal or foreign-model expansion.
- Attribute names/suffixes, eligible optional defaults, and grammar-safe parentheses/statement cleanup. Writer assignment/default-emission repairs also apply in the default pipeline.
- Optional.IsDefined: exact/actual ancestor namespace with no intervening namespace-local import/extern activation; invariant affected statement/binding scope, allowing only certified later nested-block variation.
- Recorded whole-type crefs: existing strict/immediate certificates plus bounded bare top-level nongeneric type import activation. The intentional diagnostic delta is only disappearance of unsuppressed default-Hidden CS8019 when shortening genuinely makes the existing normal import used. Other diagnostics/reporting/source/binding checks remain. Real exception-cref provenance preserves original qualified writer text; generic/nested exception shapes retain the previous path. No code-witness certificate.
- Branch-local static invocations: ordinary block-method ownership, invariant complete method/occurrence in active parses; whole call disabled in inactive parses with matching ownership, visible single-line provenance and no overlapping active expression/argument/local-function source span. Original closure/outer-argument/source/lookup/token/directive safeguards remain. No blanket inactive-branch bypass or source-flag reset.

Paused serialization-context work and the deferred imported-cref code-witness experiment are excluded. Historical C3, C6 `nameof`, C7 method-call `this` and C10 SDK-shaped generic inference remain excluded.

## Saved AppService reach

Same saved input and Roslyn5.9 reference, **2,301 emitted files**. Counts are deduplicated syntax-taxonomy events, not diff lines or safe-edit estimates.

| Checkpoint                 | Residual events |
| -------------------------- | --------------: |
| Initial structural slice   |         165,725 |
| Historical accepted C9     |          29,336 |
| C9 + SDK-shaped casts      |          25,726 |
| Both Optional refinements  |          23,747 |
| Cref policy/provenance     |          20,718 |
| Bounded branch-static rule |      **19,463** |

Latest evaluation removed **1,255 static-receiver prefixes /596 files**:627 JsonDocument,627 JsonSerializer and1 BinaryData.FromString. Every other category was unchanged. Earlier Optional refinements removed1,979 events; cref policy/provenance removed3,029 events/202 files.

| Remaining group                                             |     Events |
| ----------------------------------------------------------- | ---------: |
| Type-name qualifications (cast/generic and object creation) |      3,940 |
| Method-call `this.`                                         |      3,834 |
| Static receivers                                            |      2,811 |
| Qualified `nameof`                                          |      2,399 |
| XML crefs                                                   |      1,945 |
| Complete receivers                                          |      1,678 |
| Attributes                                                  |        817 |
| Factory `(T)default` casts                                  |        784 |
| Parentheses                                                 |        665 |
| Explicit generic arguments                                  |        560 |
| Small remainder                                             |         30 |
| **Total**                                                   | **19,463** |

## Validation and evidence boundaries

The latest pre-main-merge local epoch passed **308 focused Roslyn5.9 tests**, including21 new branch cases/direct checks. Six configurations compare operation trees, calls/conversions/constants and complete compiler/emit diagnostic multisets with all location endpoints. **No explicit CFG comparison is claimed.** Both the original Action-to-Func/CAE witness and inactive-only closure witness retain qualification; forced edits still change real synthesized strings, keeping the regressions meaningful. The existing directive-bearing receiver veto was traced and preserved, not relaxed to force a positive.

Authentic original reconstruction uses2,699 documents/20 references. The latest actual ProcessDocument case uses all116 writer records/138 type nodes, removes exactly2JSON prefixes, preserves exact constructed calls/receiver types and complete ordinary/unfiltered document diagnostic bags4→4. Original missing source-generator `.Default` errors are preserved, not repaired or ignored. Probe20.08s including7.78s first ProcessDocument/shared facts—not comparative timing.

One candidate-only saved-input replay took115.5s, with no baseline generation/build or fresh TypeSpec compilation. All2,301 output hashes and every changed UTF16/BOM-preserving source reconstruction were independently checked; exact2,677-file SDK restoration and unrelated WIP/dependency preservation verified. These are reach/source/restoration evidence, **not whole-SDK semantic/compiler/emit/native/API clearance for this epoch**.

Historical CAST validation remains historical:3,824 Core/2,509 client tests; official unfiltered LOCAL/Spector956 passed/10 skipped;10,830 semantic comparisons, complete compiler/emit bags and native net10 GA AppService1.5.0 API/byte-identical XML. It is not automatically inherited by the newer rules or a merge of main. The stopped serialization-context graph pipeline remains stopped. Fresh netstandard2.0/net8.0 and comparative profiling remain deferred.

Post-main-merge checks and their results are reported in the PR description. Broader SDK/native/API/whole-XML validation remains pending; no default enablement is implied. Large local captures, benchmarks and paused work are intentionally not checked in.

Earlier architecture/history: [ProviderReducerPrototype.md](ProviderReducerPrototype.md), [StructuralTypeNameReduction.md](StructuralTypeNameReduction.md).
