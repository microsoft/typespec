# Task17 handoff: whole-type documentation ownership

Contract: [Task17](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550733).
Dependencies: Tasks03, 04, 08 and 11. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare producer-recorded WHOLE-type documentation references and explicit
exception-reference occurrences, with intended target and lexical/documentation
attachment known before emission. Implement the accepted strict and immediate-namespace decisions for the supported top-level/nongeneric-nested forms and exact
namespace/alias limits. Retain conditional and unsupported generic shapes; do not
expand generic documentation handling beyond the original certified contracts.

Do not rewrite arbitrary prose, code text, member signatures, documentation-ID
strings or guessed qualified substrings. No new import activation or imported-reference code-witness experiment; bounded activation is Task18.

## Minimal mechanism

Own the actual documentation producer and occurrence, not merely a target type or
formatted XML string. Keep exception-reference identity explicit, siblings isolated
and missing/duplicate producer identities unavailable.

Use the actual shared symbol catalog plus bounded documentation lookup/grammar
facts. Ordinary C# type plans cannot be applied blindly to documentation: grammar,
attachment, method/type-parameter/alias capture and generic target rules differ.
The serialized parser-selected symbol is an oracle in tests, not a production
lookup over generated XML.

Compose with planned type/default spellings and surviving import uses. An original
code/default witness may disappear; do not assume it survives or allow prepared
uses to impersonate original facts. Imported shortening needs a genuine independent
surviving witness from already admitted original/type/default contracts; do not
scan arbitrary code to expand witness admission. Immediate-namespace shortening
must not consume an otherwise unused import or change its hidden diagnostic.

The existing ordinary documentation formatter and exception writer have different
paths; wrapping only AppendTypeForCRef misses the real exception producer. Current
emission-envelope facts are not lookup/ownership proof and reject exception reasons.
Add only the bounded summary/exception contracts needed, without replaying lazy or
custom producers or building a general formatting-purity framework.

## First checkpoint

Take one original strict/imported whole-type positive through the structured
summary producer and its actual :C path, with an independently surviving code use.
Add an immediate-namespace case whose unused-import diagnostic stays unchanged,
then the explicit XmlDocExceptionStatement writer with a surviving witness. Pair
these with unrecorded siblings, same-named member/type-parameter capture and
missing/duplicate-identity retention controls.

Assert the prepared whole-root choice and raw XML, then serialized parser-selected
target, XML structure, diagnostics and source/trivia ownership. A manually authored
XML string or producer helper alone is not admitted writer acceptance.

## Remaining accepted coverage

- Supported strict/immediate namespaces and exact generic/nested grammar cases.
- Actual exception occurrence identity, sibling isolation and source attachment.
- Same-named method/type-parameter/alias capture and wrong/missing ownership.
- Default/type choices that remove or preserve an import witness.
- Original conditional and unsupported-shape retention; no global source bypass.
- Prose/code/member-signature/ID text and malformed array-reference retention,
  visibility order, multiline XML exterior and actual caller-line observations.

Anchors: StructuralCrefTests, StructuralCrefSafetyTests,
StructuralImmediateNamespaceCrefTests and StructuralC5Cref*Tests.

## Stops and completion

Do not turn this into an XML parser, documentation-ID rebinder or import activation
engine. Add only the bounded producer/lookup fact needed by a selected accepted
reference. Complete original whole-type positives, serialized/native diagnostics
and composition; leave Task18's distinct activation phase with its owner.
