# Task15 handoff: Optional.IsDefined affected-statement scope

Contract: [Task15](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550062).
Dependency: Task14. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare the certified direct method-body if-condition refinement with an invariant
affected statement and binding/declaration scope. Allow only the accepted variation
inside a later nested block.

Do not turn this into a general statement-scope bypass or the excluded wider
conditional document/scope-veto experiment.

## Minimal mechanism

Use structured ownership/declaration plans for the affected statement, its header,
enclosing owner and declarations that can influence the earlier occurrence.
A later nested block is not the same declaration space as a later declaration
directly in the method body; temporal ordering alone does not establish safety.

Reuse Task13/14 call, ancestry, import and source facts. Do not compare generated
text, build a statement-equivalence engine or ignore all later code.

## First checkpoint

Start with OptionalStatementScopeTrial scenarios 0/1: the SDK-shaped later
conditional sibling block and later nested Optional declaration. Pair scenario 2's
later method-body declaration negative in its original method/if shape.
Assert prepared correspondence and raw qualifier, then exact lookup/callee,
diagnostics and runtime under all relevant supported test parses.

## Remaining accepted coverage

Anchors: StructuralOptionalStatementScopeTests, all scenarios 0-8. Include earlier/
later outer shadow, varying affected body, caller capture, unrecorded receiver,
foreign namespace/import and Optional.Other not acquiring IsDefined authority.
Keep changed surrounding ownership, enclosing statement/header changes and
unsupported nested/lambda/local-function contexts retained. Preserve actual namespace,
import/extern/collision, caller-info and source guards from Tasks13/14.

## Stops and completion

A broader document-veto relaxation is not required to close Task15. A desired new
scope shape needs a separate concrete decision; do not assign it to Task16 by
default. Complete only the accepted second refinement with original positives and
retention controls, not arbitrary future variations of surrounding code.
