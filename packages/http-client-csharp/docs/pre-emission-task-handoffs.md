# Pre-emission task implementation handoffs

Planning lives on **feature/pre-emission-field-types** in the fork. Start with
the [shared implementation guide](./pre-emission-implementation-guide.md), then
the owning task's handoff and authoritative issue comment.

Tasks01-03 are integrated at baseline 674e6ca. Task04's existing handoff is copied
here from its planning branch; Tasks05-19 below are planning documents, not claims
that their implementation, missing facts or validation already exist.

| Task | Implementation handoff                                                                                | Authoritative contract                                                               |
| ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 04   | [Ordinary type spellings](./pre-emission-task04-implementation-handoff.md)                            | [Task04](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541243) |
| 05   | [Ordinary parentheses and writer grammar](./pre-emission-task05-implementation-handoff.md)            | [Task05](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541641) |
| 06   | [Ordinary static type receivers](./pre-emission-task06-implementation-handoff.md)                     | [Task06](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544118) |
| 07   | [Supported field/property this receivers](./pre-emission-task07-implementation-handoff.md)            | [Task07](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544409) |
| 08   | [Optional-parameter default literals and witnesses](./pre-emission-task08-implementation-handoff.md)  | [Task08](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544709) |
| 09   | [Attribute names and suffixes](./pre-emission-task09-implementation-handoff.md)                       | [Task09](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544998) |
| 10   | [Retained SDK-shaped interface casts](./pre-emission-task10-implementation-handoff.md)                | [Task10](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547008) |
| 11   | [Configuration correspondence and conditional types](./pre-emission-task11-implementation-handoff.md) | [Task11](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547354) |
| 12   | [Conditional parentheses](./pre-emission-task12-implementation-handoff.md)                            | [Task12](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547652) |
| 13   | [Conditional static invocations](./pre-emission-task13-implementation-handoff.md)                     | [Task13](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543548000) |
| 14   | [Optional.IsDefined namespace ancestry](./pre-emission-task14-implementation-handoff.md)              | [Task14](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543549731) |
| 15   | [Optional.IsDefined statement scope](./pre-emission-task15-implementation-handoff.md)                 | [Task15](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550062) |
| 16   | [Bounded branch-local static invocations](./pre-emission-task16-implementation-handoff.md)            | [Task16](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550382) |
| 17   | [Whole-type documentation references](./pre-emission-task17-implementation-handoff.md)                | [Task17](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550733) |
| 18   | [Bounded documentation import activation](./pre-emission-task18-implementation-handoff.md)            | [Task18](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543556860) |
| 19   | [Integration and final replacement](./pre-emission-task19-implementation-handoff.md)                  | [Task19](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543557177) |

## Sequencing without circular scope growth

Keep the dependencies recorded in each contract. They identify capabilities
consumed, not permission to implement all later families in an earlier task.

- Task04 supplies ordinary owned type slots and child spelling choices; Task05
  composes grammar with those choices. Tasks06-10 add their bounded consumers.
- Task10's unconditional cast slice precedes Task11; Task11 supplies correspondence
  for Task10's conditional slice. Do not make these phases wait for each other's
  complete conditional implementation.
- Task11 provides shared configuration facts for Tasks12/13; Task14 and then
  Task15 are narrow refinements. Task16 owns the separately bounded branch-local
  profile, not a relaxation of every Task13 guard.
- Task17 establishes whole-type documentation ownership and strict/immediate
  decisions before Task18 import activation. Task18 does not become general
  import cleanup.
- Task19 composes accepted migrated families, removes legacy reduction and checks
  final interactions. It is not a new compiler-owner or public-rollout project.

See the [Task03 scoped checklist](./pre-emission-task03-checklist.md) and
[follow-up ledger](./pre-emission-task03-follow-up-ledger.md) for retained original
requirements. In particular Task13 owns both variants of the specifically agreed
reduced-extension receiver capture regression; general conditional property
expansion is still excluded. The Task13 handoff explicitly flags other field/
property fixtures for occurrence-level ownership/scope reconciliation before
implementation; their original expectations must not be dropped or broadened.

## How to use these handoffs

Freeze an owning task's finite accepted inventory and first checkpoint before
production edits. Report raw outcomes, actual coverage versus estimates, added
machinery, retained controls and exact validation. Review complexity before
expanding another family. These documents do not waive accepted positives,
authorize source/test changes in this docs-only commit, or turn the full roadmap
into a new prerequisite for every task.
