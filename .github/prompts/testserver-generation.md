# HTTP testserver scenarios

Use this workflow when adding scenarios to `packages/http-specs/specs`.

## Scope

Limit implementation changes to `packages/http-specs/specs` and, when needed, spelling entries in the root `cspell.yaml`. `packages/http-specs/spec-summary.md` is generated; do not edit it directly.

Use existing scenarios and mock APIs in `packages/http-specs/specs` as the primary examples.

## Scenario requirements

- Add `@scenario` and an explicit `@scenarioDoc` describing inputs and expected outputs.
- Add the matching implementation in `mockapi.ts`.
- Prefer an existing spec file and namespace when it fits.
- Choose namespaces, interfaces, and operation names that produce a concise, descriptive dashboard name.
- Use interfaces to group related transports or behaviors.
- Keep routes consistent with the scenario.
- Preserve existing scenario documentation unless the task explicitly changes that scenario.

## Validation

From `packages/http-specs`, run:

```sh
pnpm build
pnpm validate-mock-apis
pnpm regen-docs
```

Then run the repository formatting, spelling, and lint checks relevant to the changed files. Ensure generated `spec-summary.md` changes are included.

Add the changelog entry from the repository root:

```sh
pnpm chronus add @typespec/http-specs --kind=feature --message="<change-summary>"
```
