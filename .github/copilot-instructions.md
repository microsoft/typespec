# TypeSpec development

TypeSpec is a monorepo containing the compiler, standard libraries, tools, documentation, and client emitters.

## Scope

The root pnpm workflow applies to the workspace except for these independently managed emitters:

- `packages/http-client-csharp`
- `packages/http-client-java`
- `packages/http-client-python`

For those emitters, follow their package-specific instructions and use npm rather than the root pnpm setup.

## Workspace workflow

- Install dependencies with `pnpm install`.
- Build the workspace with `pnpm build`, or use `pnpm -r --filter "<package-name>..." build` while iterating on one package and its dependencies.
- Run the relevant package tests while iterating. Run `pnpm test` when a full workspace test is warranted.
- Check formatting with `pnpm format:check` and lint with `pnpm lint`. Use `pnpm format` and `pnpm lint:fix` to apply fixes.
- Prefer scripts declared in the root or package `package.json` over ad hoc commands.

After changing compiler or library behavior, validate a representative TypeSpec program in addition to its unit tests. Regenerate checked-in samples, documentation, or external signatures when the affected package requires it.

## Changes

- Add or update tests for behavior changes.
- Do not modify unrelated generated files or `pnpm-lock.yaml`.
- Add a changelog entry for user-facing or package changes with:

  ```sh
  pnpm chronus add <package-name> --kind=<kind> --message="<summary>"
  ```

  Valid kinds are defined in `.chronus/config.yaml`. Use separate entries when packages have different change kinds. Documentation-only, test-only, and internal repository changes may not require an entry; follow Chronus verification.

- Format and lint before committing.

## Repository map

- `packages/compiler`: compiler and CLI
- `packages/http`, `packages/rest`, `packages/openapi3`: HTTP and API libraries
- `packages/http-specs`: shared HTTP scenarios and mock APIs
- `packages/prettier-plugin-typespec`: TypeSpec formatting
- `packages/typespec-vscode`, `packages/typespec-vs`: editor extensions
- `website`: documentation and playground
- `eng`: build and release tooling

## Task-specific guidance

- [HTTP testserver scenarios](./prompts/testserver-generation.md)
- [C# client emitter](./instructions/http-client-csharp.instructions.md)
- [Java client emitter](./instructions/http-client-java.instructions.md)
- [TCGC upgrades](./prompts/upgrade-tcgc.instructions.md)
