# Task11 handoff: configuration correspondence and conditional types

Contract: [Task11](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547354).
Dependencies: Tasks03, 04 and 10. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare supported configuration, owner, occurrence and scope correspondence from
the provider/directive plan plus already loaded original non-generated source and
framework views. Preserve the accepted custom/shared/partial policy.

This is not a preprocessor solver, new framework matrix, MSBuild/Csc owner,
generated-syntax preparation pass or post-write decision engine. Conditional here
means the supported directive/configuration profile, not new expression lowering.

## Minimal mechanism

Use one shared correspondence plan keyed to canonical owners, roles and occurrence
paths. Preserve the actual original preprocessor symbol/options sets, including
noncanonical inputs, not just framework labels. Record active counterparts,
whole-call inactivity where Task16 permits it, and explicit unsupported states.
Consumers require different evidence strengths; do not create one universal
configuration-safety boolean. Record stable headers and target/construction facts
only where that consumer needs them. Preserve inactive text and original source
flags. No-counterpart, varying header/type-parameter/owner/local-function scope,
unsupported directive or framework facts remain unavailable.

Reuse current input/freshness guards. IfElsePreprocessorStatement's variant edges
are not correspondence, and CompleteSourceInputSnapshot currently has one
compilation/parse-options view, not a semantic framework matrix. Missing required
views are an explicit input-contract gap. Conditional loaded source is currently
rejected by HasUnsupportedSource; add positive profile evidence instead of deleting
that guard or resetting unavailable source flags.

Do not construct generated syntax or compile generated output in alternate
configurations to choose a spelling. Alternate parses and native bindings belong
in tests; compare before/after within each configuration, not semantic equality
between different configurations.

## First checkpoint

Start with StableConditionalDocumentReducesOnlyActiveSyntaxAndPreservesEveryConfiguration:
shorten its accepted property declaration type, active declaration and later typeof,
while retaining inactive bytes and the directive-bearing boundary declaration.
Pair it with the original unstable-partial/header counterpart. Assert prepared correspondence and raw
choices in the real provider/writer plan, then validate every relevant test parse,
exact type/construction/header and inactive source. Do not replace the original
partial relationship with a simpler single-part owner.

## Consumer phases

- Task04 supplies the ordinary type-slot capability; Task10 supplies its
  unconditional retained-cast capability.
- Adopt their accepted conditional cases only with the required stable-owner
  facts. This does not require Task10's entire conditional phase to finish first.
- Expose the same configuration facts for Tasks12/13; they add grouping/call
  permissions, not parallel configuration engines.

Anchors: StructuralTypeNameQualifiedContextTests, StructuralNamespaceRoleTests,
StructuralSdkCastTypeQualificationTests and ProviderConditionalSyntax regressions.

## Stops and completion

Do not relax a header veto or mark all inactive branches safe to obtain a positive.
A new framework/directive shape needs a concrete accepted case and bounded plan.
Complete the supported correspondence and accepted conditional consumers with
original flags, inactive text and native test evidence preserved; unknown retention
does not satisfy an accepted shortening positive.
