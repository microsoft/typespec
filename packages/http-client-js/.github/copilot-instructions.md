# JavaScript client emitter

These instructions supplement the repository guidance for changes under `packages/http-client-js`.

## Implementation

- This package emits TypeScript HTTP clients as ES modules.
- Use Alloy components from `@alloy-js/core`, `@alloy-js/typescript`, and `@typespec/emitter-framework/typescript`; do not use React.
- Use TypeSpec typekits through `@typespec/compiler/experimental/typekit` and the HTTP typekit when inspecting the type graph.
- Do not add dependencies without a concrete need.
- Follow existing component and transform patterns rather than introducing a parallel abstraction.

Before changing Alloy code, read the installed `@alloy-js/core` and `@alloy-js/cli` documentation referenced by the repository's `AGENTS.md`.

## Tests

Emitter scenarios are literate tests in `test/scenarios/**/*.md`:

- An H1 heading creates a Vitest `describe`.
- The `## Spec` section contains one TypeSpec input block.
- TypeScript blocks under expectation headings create test cases for generated output.
- Preserve existing TypeSpec and TypeScript blocks unless the behavior change requires updating their expectations.
- Use the existing emitter-framework harness; do not add another test framework.

Run the focused scenario tests while iterating, then the package `build`, `test`, `format`, and `lint` scripts.
