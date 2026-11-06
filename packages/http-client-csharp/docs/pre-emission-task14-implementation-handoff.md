# Task14 handoff: Optional.IsDefined actual namespace ancestry

Contract: [Task14](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543549731).
Dependency: Task13. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare only the accepted Optional.IsDefined actual-ancestor namespace refinement.
The target's actual namespace and exact ancestor relationship matter; do not
hard-code Azure.Core or infer a foreign Optional API by spelling.

This is not general namespace-veto relaxation or another static-receiver family.

## Minimal mechanism

Extend the existing Task13 receiver decision with bounded actual target/namespace
ancestry, lookup precedence and intervening namespace-local import/extern facts.
Use real namespace structure and selected binding, not textual StartsWith checks.

Keep ordinary receiver authorization and this special namespace refinement
separately attributable. Intervening imports/externs, nearer declarations,
aliases/values, source/configuration policy and complete call binding still veto
as required. Do not clear the underlying Task13 source or executable-unit guards.

## First checkpoint

Start with OptionalAncestorScopeTrial scenarios 0-2: dotted namespace, explicit
nested namespace and multiple ancestor levels, preserving the original later
conditional-body context. Include namespace-local import/collision counterparts
through preparation and the writer.
Assert raw spelling, exact target/callee and all relevant native parses. Include
a changed namespace spelling so package-name coincidence cannot authorize it.

## Remaining accepted coverage

Preserve the complete StructuralOptionalAncestorScopeTests inventory, including
ancestor boundaries, intervening namespaces/imports/externs and nearer lookup
competitors. Keep scenarios 3-9: local/intervening imports, same-target alias,
unrelated import retention, conditional outer shadow, caller capture and a foreign
non-ancestor namespace. Preserve complete diagnostics including Hidden CS8019
and projected locations even when binding is equal. Unknown ancestry or binding
remains unavailable locally.

## Stops and completion

If a case also needs a statement-scope refinement, keep that obligation with
Task15; do not loosen unrelated guards here. Complete this exact refinement and
its controls without a general namespace-lookup framework.
