---
applyTo: "packages/http-client-csharp/**/*"
---

# http-client-csharp Development

## Setup

- This package is outside the pnpm workspace. Use its npm scripts instead of the root workspace setup, and do not add a Chronus entry.
- Do not change the `global.json` file. Install the appropriate .NET SDK if not already installed in the environment.
- Run commands from `packages/http-client-csharp`.
- Run `npm ci` and `npm run build`. When changing dependencies, use `npm install` instead of `npm ci` so the lockfile is updated.

## Development & Testing

- Add focused positive and negative tests and confirm a new regression test fails before the implementation.
- When adding new tests look for an existing test class that would be appropriate. Only create a new test class if you are adding a new TypeProvider or there is otherwise no existing test class that would make sense.
- If your test requires inputting C# code (either to test customization or to validate the expected output), put the code in a new file under the TestData folder for the corresponding test class. Do not inline literal C# test code. Examine tests that use `Helpers.GetExpectedFromTest` to determine the correct folder structure for TestData files.
- Regenerate generated libraries with `pwsh ./eng/scripts/Generate.ps1` when generator output changes.
- Run the relevant tests, then `npm test`.
- Do not comment out or delete any existing tests.
- Run the Cop static-analysis checks locally with `npm run cop` (which invokes `eng/scripts/Invoke-Cop.ps1`). This downloads the pinned Agent Cop release and runs the rules under `cop-checks/` against the generator, failing on any violation. Ensure it reports `cop checks passed.` before committing C# changes.
