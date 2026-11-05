# Task12 handoff: conditional parentheses

Contract: [Task12](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547652).
Dependencies: Tasks03, 05 and 11. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare grouping-only decisions for the exact accepted conditional-profile
parenthesized shapes. Compose Task05 grammar with Task11 correspondence.
Do not add branch-local grouping admission, null-conditional lowering, per-edit
whole-document compilation or a source-flag reset.

## Minimal mechanism

For each candidate, establish equivalent affected occurrence/parent grammar and
argument/call ancestry across all relevant supported parses. Grouping-only proof
may tolerate varying value types; it must not borrow a type-spelling or call-binding
permission to ignore changed ancestry.

Keep no-counterpart and branch-local wrappers retained. Explicit capture text does
not remove the requirement for a matching wrapper/call/argument context elsewhere.
Preserve eligible wrappers outside calls when their edit cannot change argument
source. Use structured plans, not comparisons of written syntax.

## First checkpoint

Start with StructuralConditionalParenthesesCommonOutsideCalls and its original
return ((x == y)) under an unrelated conditional sibling. Pair branch-local and
protected-owner retention, then no-counterpart/changed-ancestry controls through
the actual writer. Assert raw omission/retention, then
native operations/diagnostics and source observations in every relevant test parse.
Include an explicit-text override control without simplifying the original ancestry.
An outer wrapper around a capturing call can reduce without editing its argument;
argument/call and captured-lambda ancestry still retain as required. Do not import
Task13's complete-executable-unit equality requirement into grouping-only proof.

## Remaining accepted coverage

- Equivalent grammar with varying value types where grouping is independently safe.
- Argument/call and nested ancestry, wrapper counterpart and visibility controls.
- Useful wrappers outside observed calls without contaminating captured regions.
- Task05 separators/token/trivia/layout constraints after chosen child spellings.
- LF/CRLF, later caller lines, cast/receiver barriers and hidden/visible ordering.
  Reuse the existing normalized operation-tree oracle. It checks compiler errors
  and operation equality, but does not by itself establish full diagnostic-bag
  or emit parity; add only the missing evidence, not another operation engine.

Anchors: StructuralConditionalParenthesesTests,
StructuralConditionalParenthesesSafetyTests and
StructuralParenthesesGrammarVisibilityTests.

## Stops and completion

Do not fold this into a general conditional binder or relax Task11 for an
unsupported branch. Complete the original grouping positives and retained
counterexamples; branch-local static-call work in Task16 does not grant grouping
permission here.
