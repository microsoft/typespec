# Copilot Instructions

## Install and Build

- Packages are located in the `packages` folder
- Use `pnpm` as the package manager
- Use `pnpm install` to install dependencies
- Use `pnpm build` to build every package
- Use `pnpm -r --filter "<pkgName>..." build` to build to a specific package `<pkgName>`
- Use `pnpm format` to format all files

## Describing changes

- Repo use `@chronus/chronus` for changelogs
- Use `pnpm change add` to add a change description for the touched packages
- Types of changes are described in `.chronus/config.yaml`

## Testserver Generation

- DO read the existing `main.tsp` and `client.tsp` files in the specs repo [here][spector-tests].
- DO read the existing `mockapi.ts` mockapi files in the specs repo [here][spector-tests]. Follow the imports and overall structure from these test files to write your own mockapi tests
- DO read descriptions of the input and output of existing tests and mockapis [here][spector-description].
- DO run `pnpm install` to fully set up repo
- DO only modify code in the `cspell.yaml` file OR `packages/http-specs/specs` folder
- DO add a `@scenario` and `@scenarioDoc` for every scenario you are adding. Keep in mind that the `@scenarioDoc` needs to clearly and explicitly tell users exactly what values to input and what values to expect from output.
- DO add a mockapi implementation of each scenario in the `mockapi.ts` file.
- DO ensure that every scenario has a mockapi implementation,
- DO see if there are existing spec files that you can add the specification to. If not, DO create new files and folders for the new scenario
- DO know that the path of namespace and interfaces until you reach your `@scenario`-decorated operation is the full scenario name that appears in the dashboard. Make sure that the dashboard scenario name cleanly describes the exact situation that is being tested, is clear to read, and has as few words as it can
- DO keep the route names consistent with the scenario names
- DO decide whether a scenario is better as a collection of operation calls, or a single operation call. If it is better as a collection of calls, try to group the operation calls into an interface and decorate the interface with `@scenario` and `@scenarioDoc`.
- DO group operations into interfaces if it makes sense for current layout or future expansion. For example, in parameters tests, try to group them by `path`, `query` etc in interfaces, even if each operation is still its own scenario.
- DO run `pnpm build` from `packages/http-specs` to verify it builds and scenarios pass. If this step fails, DO attempt to fix the error.
- DO run `pnpm regen-docs` from `packages/http-specs` to automatically regenerate the docs. DON'T manually write in `spec-summary.md`
- DO run `pnpm validate-mock-apis` from `packages/http-specs` to verify there is correct mockapi implementation for each scenario. If this step fails, DO attempt to fix the error.
- DO run `pnpm cspell` to find any spelling issues. If there are spelling issues and you believe the word is valid, please add it to `cspell.yaml`. If the word is invalid but you need to use it, use cspell disables to ignore that line. If the word is invalid and you don't need to use it, change the word.
- DO run `pnpm format` to clean up any formatting issues.
- DO run `pnpm lint` to find any linting issues. DO fix these linting issues to the best of your ability without impacting the quality of the tests.
- DO run `pnpm change add` from the root and add a changeset for the touched package. DO select it as being a new feature.
- DO only add the `lib:http-specs` label to the PR you create.
- DON'T remove or modify existing scenario docs

<!-- References -->

[spector-tests]: https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs
[spector-description]: https://github.com/microsoft/typespec/blob/main/packages/http-specs/spec-summary.md
