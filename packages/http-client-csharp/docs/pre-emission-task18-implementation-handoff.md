# Task18 handoff: bounded documentation import activation

Contract: [Task18](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543556860).
Dependencies: Tasks04, 08 and 17. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Activate only the accepted bare top-level nongeneric type/exception reference
against its EXISTING normal import and actual merged compilation namespace.
This does not insert arbitrary usings or perform general unused-import cleanup.

Permit only the accepted disappearance of unsuppressed default-Hidden CS8019.
Every other diagnostic, reporting/source/binding policy and unrelated hidden
import remains preserved. Generic/nested activation and code-witness admission
remain excluded.

## Minimal mechanism

Prepare original import/use and reporting-policy facts, the real merged namespace,
actual documentation producer identity and surviving type/default witnesses.
Merged namespace identity cannot be guessed from one assembly or a namespace
string alone.

Keep original baseline import use separate from consequences of selected plans.
A prepared type/default/reference choice cannot justify its own activation as an
original witness. Compose the finite choices before emission; do not compile
generated output for a diagnostic certificate.

Retain global/static/alias/extern environments, custom severity/suppression/options,
other warnings, same-named member capture and missing/duplicate ownership as
required. Do not ignore a diagnostic delta just because the target still binds.

## First checkpoint

Reproduce ExceptionCrefActualWriterImportActivation through the ACTUAL exception
writer and merged-namespace fixture without an independent code witness: the
normal System import starts genuinely unused. Assert existing import identity,
prepared activation and raw XML before legacy processing.

In tests, compare serialized binding and complete diagnostic bags with mapped
locations, properties, additional locations, suppression/default severity and emit
results. Include the associated default Hidden CS8019, unchanged unrelated hidden
imports and custom compilation/tree severity/suppression counterparts that retain.

## Remaining accepted coverage

- Type and exception producers, correct merged namespace and member capture.
- Original/surviving witnesses with type/default/documentation combinations.
- C5 default/reference counterexamples, nondefault reporting policies and source
  ownership/visibility/trivia restrictions. Preserve DocumentationMode.Parse and
  Diagnose positives versus None retention, and unsupported-import controls in
  other documents.
- Same-target sibling references with independent producer/occurrence authority.

Anchors: StructuralCrefImportActivationTests,
StructuralC5CrefDiagnosticRegressionTests, StructuralC5CrefDiagnosticSafetyTests
and StructuralC5CrefCompositionRegressionTests.

## Stops and completion

Do not add a general diagnostic engine, post-write owner, generic/nested activation
or ordinary code-witness experiment. If an accepted activation lacks original-use
or reporting data, add that specific bounded input fact; do not fabricate cleared
flags or filter more diagnostics. Complete exact raw/binding/diagnostic composition,
not only a single short reference with a different warning bag.
