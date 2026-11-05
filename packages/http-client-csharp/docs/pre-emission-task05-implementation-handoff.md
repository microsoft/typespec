# Task05 handoff: ordinary parentheses and writer grammar

Contract: [Task05](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541641).
Dependencies: Tasks03 and 04. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare grouping, precedence and separator choices for the exact accepted M2
payload/parent-role inventory. Include nested chains, binary associativity and
left/right operand differences, required cast operands, member/invocation/indexer
receiver barriers and the admitted outer-cast grouping cases.

No reassociation, general pattern-parentheses simplification, unsupported/default-literal payload expansion or broad hidden-source repair. Conditional-profile
grouping belongs to Task12. Do not remove existing writer assignment/default
repairs or change legal expression-statement emission.

## Minimal mechanism

Use one parent/child grammar policy over the existing structured nodes. Inputs
include operator/payload kind, exact parent edge and ancestry, selected child
spellings, boundary tokens/separators and source-observation facts. Prepare
keep/omit/separator choices before emission; do not write once to discover
precedence, lex generated text, or build another general expression model.

A child spelling can change lexical ambiguity without changing its type. Compose
with Task04 plans before deciding parentheses, and later Task07 receiver choices
through preparation ordering, not another write or a dependency cycle. Source
capture/layout restrictions are separate from precedence.

Binary/cast writers already manufacture grouping; the inspected IR has no dedicated
parenthesized-expression node for every raw prototype wrapper/trivia case. Decide
the minimal trusted grouping contract first. Do not mutate a shared AddParentheses
flag to authorize every occurrence of an expression.

## First checkpoint

Start with an original structured binary expression in a return/arrow slot:
remove unnecessary outer grouping but retain the right-associated subtraction
counterpart. Include the no-recorded-type-reference case so admission needs no
dummy field or type reference. Use the actual parent role, plus an observed
counterpart that retains. Assert prepared/raw form, native operations/diagnostics
and captured text, one traversal and changed-child same-pass fallback.

## Remaining accepted coverage

- Left/right binary operands, nested grouping chains and outer-cast cases.
- Cast and member/invocation/indexer receiver requirements.
- Sibling relational/generic argument-list ambiguity and required separators.
- Comments, LF/CRLF, token boundaries, source guards and original writer repairs.
- Combined type spelling plus grouping without either decision authorizing the other.

Anchors: StructuralParenthesesTests, StructuralParenthesesSafetyTests,
StructuralParenthesesGrammar*Tests and existing writer/expression regressions.
Preserve StructuralParenthesesNonReassociatingCasesKeepOperations and
StructuralParenthesesRetainsParserAndAncestralBarriers. Conditional cases embedded
in grammar-safety files are cross-referenced to Task12, not silently dropped.

## Stops and completion

Unknown payload/role facts retain; they do not justify a general parser or flag
reset. A missing accepted positive stays open. Do not repair unrelated statement
syntax under the label of parentheses cleanup.

Complete only after the accepted inventory, raw/pipeline composition and native
grammar/source controls pass the shared validation gates. A simple grouping demo
does not close the left/right, separator or source-observation cases.
