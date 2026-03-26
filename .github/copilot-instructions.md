# TypeSpec Copilot Instructions

**ALWAYS follow these instructions first and only fall back to additional search and context gathering if the information here is incomplete or found to be in error.**

TypeSpec is a language for defining cloud service APIs and shapes. This monorepo contains the TypeSpec compiler, standard library packages, tools, documentation, and various language client emitters.

> [!IMPORTANT]
> **These instructions do NOT apply to the language emitter packages** (`http-client-csharp`, `http-client-java`, `http-client-python`). Those packages are excluded from the pnpm workspace and do not require using pnpm.

## Essential Setup and Build Commands

### Prerequisites and Installation

- Install Node.js 20 LTS: `curl -fsSL https://nodejs.org/dist/v20.19.4/node-v20.19.4-linux-x64.tar.xz | tar -xJ --strip-components=1 -C /usr/local`
- Install pnpm globally: `npm install -g pnpm`
- Install dependencies: `pnpm install` (takes ~1.5 minutes)
- Install Playwright browsers (optional for UI testing): `npx playwright install`

### Building the Project

- **CRITICAL**: Build the entire project: `pnpm build` (takes ~7 minutes, NEVER CANCEL - set timeout to 15+ minutes)
- Build in watch mode for development: `pnpm watch`
- Build specific package: `pnpm -r --filter "<package-name>..." build`
- Clean build artifacts: `pnpm clean`

### Testing and Validation

- **CRITICAL**: Run all tests: `pnpm test` (takes ~5 minutes, NEVER CANCEL - set timeout to 10+ minutes)
- Run E2E tests: `pnpm test:e2e` and `node e2e/e2e-tests.js` (~1 minute)
- Run tests with coverage: `pnpm test:ci`
- Run tests in watch mode (in specific package): `pnpm test:watch`

### Code Quality

- Check formatting: `pnpm format:check` (~1 minute)
- Format code: `pnpm format`
- Run linting: `pnpm lint` (~1 minute)
- Fix lint issues: `pnpm lint:fix`

### Essential TypeSpec Development Workflow

1. **ALWAYS** run the full build process after repository clone: `pnpm install && pnpm build`
2. Start watch mode: `pnpm watch`
3. Test TypeSpec compilation works:

   ```bash
   # Create test project
   mkdir test-tsp && cd test-tsp
   echo 'import "@typespec/rest"; import "@typespec/openapi3"; op ping(): void;' > main.tsp
   echo '{"dependencies": {"@typespec/compiler": "latest", "@typespec/rest": "latest", "@typespec/openapi3": "latest"}}' > package.json
   
   # Install and compile
   /path/to/typespec/packages/compiler/cmd/tsp.js install
   /path/to/typespec/packages/compiler/cmd/tsp.js compile main.tsp --emit @typespec/openapi3
   ```

4. Always format and lint before completing changes: `pnpm format && pnpm lint:fix`

## Repository Structure

### Key Packages (packages/)

- **compiler**: Core TypeSpec compiler and CLI tool
- **http, rest, openapi3**: Standard HTTP/REST API libraries
- **versioning**: API versioning support
- **json-schema**: JSON Schema emitter
- **prettier-plugin-typespec**: Code formatting support
- **typespec-vscode, typespec-vs**: Editor extensions
- **playground**: Interactive TypeSpec playground
- **website**: Documentation website (typespec.io)

### Important Directories

- `/packages/`: All TypeSpec packages and libraries
- `/e2e/`: End-to-end integration tests
- `/website/`: Documentation website source
- `/eng/`: Build engineering and automation scripts
- `/.github/workflows/`: CI/CD pipeline definitions

## Manual Validation After Changes

**ALWAYS perform these validation steps after making changes:**

1. **Basic functionality test**: Create and compile a simple TypeSpec file as shown above
2. **Build validation**: Run full build to ensure no build breaks: `pnpm build`
3. **Test validation**: Run relevant tests: `pnpm test`
4. **Code quality**: Ensure formatting and linting pass: `pnpm format:check && pnpm lint`

## Website Development

- Navigate to website: `cd website`
- Start development server: `pnpm start` (runs on port 4321)
- Build website: `pnpm build`
- The website includes documentation, API references, and the playground

## Critical Timing and Performance Notes

- **NEVER CANCEL** long-running commands - builds can take 7+ minutes, tests 5+ minutes
- Set explicit timeouts: Build commands need 15+ minutes, test commands need 10+ minutes
- Package installation: ~1.5 minutes
- Full rebuild from clean state: ~7 minutes
- Full test suite: ~5 minutes
- Lint check: ~1 minute
- E2E tests: ~1 minute

## Common Development Tasks

- Add change description: `pnpm change add`
- Generate external signatures: `pnpm gen-compiler-extern-signature`
- Regenerate samples: `pnpm regen-samples`
- Regenerate docs: `pnpm regen-docs`
- Check catalog usage: `pnpm check-catalog`

## Troubleshooting

- If builds fail with watch mode conflicts, run: `pnpm clean && pnpm build`
- For installation issues, try: `pnpm install-conflict`
- If TypeScript compilation fails, check that compiler built first: `pnpm -r --filter "@typespec/compiler" build`
- For VS Code extension development, ensure you have the workspace open at the repository root

## Commit instructions

- Always run the linting and the formatting commands before any commit.
- Follow conventional commits.

## Writing Tests

Tests use [vitest](https://vitest.dev/) with the new **tester v2** framework (`createTester`).

### Use the new tester API (v2)

**Do NOT** use the legacy `createTestHost`, `createTestRunner`, or `BasicTestRunner` APIs. These are deprecated.

Instead, use `createTester` from `@typespec/compiler/testing`:

```ts title="test/test-host.ts"
import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/my-lib"],
})
  .importLibraries()
  .using("MyLib");
```

```ts title="test/my-feature.test.ts"
import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { Tester } from "./test-host.js";

it("does something", async () => {
  const { Foo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} { name: string }
  `);
  expect(Foo.name).toBe("Foo");
});
```

Key differences from the old API:
- No `beforeEach` setup needed — use `Tester` directly in each test
- Use `t.code` template literal with markers (`t.model()`, `t.modelProperty()`, etc.) instead of `@test` decorator
- The `program` is available on the compile result — no need for `runner.program`
- See the [testing documentation](https://typespec.io/docs/extending-typespec/testing) for the full migration guide

### Do NOT wrap tests in a top-level `describe`

The test file name already provides context. Use `it()` directly at the top level. Only use `describe()` to group **sub-categories** of tests within a file:

```ts
// ✅ Good — flat structure with describe for sub-groups
import { it, describe } from "vitest";

it("basic case works", async () => { ... });

it("handles empty input", async () => { ... });

describe("edge cases", () => {
  it("handles null", async () => { ... });
  it("handles undefined", async () => { ... });
});
```

```ts
// ❌ Bad — unnecessary top-level describe wrapping the whole file
import { describe, it } from "vitest";

describe("MyFeature", () => {        // <- redundant, the file is already named my-feature.test.ts
  it("basic case works", async () => { ... });
  it("handles empty input", async () => { ... });
});
```

## Pull Request instructions

### Changelog entries

When the work is done, run `pnpm chronus add` to add a changelog entry. The valid change kinds are:

| Kind | When to use |
|------|------------|
| `feature` | New features or capabilities |
| `fix` | Bug fixes to existing features |
| `breaking` | Changes that break existing features or APIs |
| `deprecation` | Deprecating an existing feature (not breaking) |
| `dependencies` | Dependency version bumps |
| `internal` | Internal changes not user-facing (refactoring, tests, tooling, docs) |

> **IMPORTANT:** Do **NOT** use `feat`, `docs`, `patch`, `minor`, or `major` as change kinds — these are not valid. Use the exact kinds listed above.

**If a PR affects multiple packages with different types of changes, create a separate changelog entry for each.** For example, if the PR adds a feature to `@typespec/http` and fixes a bug in `@typespec/openapi3`, run `pnpm chronus add` twice to create two separate changelog entries — one with `feature` for `@typespec/http` and one with `fix` for `@typespec/openapi3`. Do NOT bundle different change types into a single entry.

### Changelog message guidelines

- Provide a clear description based on the initial issue description.
- Only add an area tag when the package has multiple areas and the change targets a secondary area; use bracket format like `[converter]` or `[formatter]` (for example, a secondary openapi3 converter change should start with `[converter]`). Avoid generic area prefixes like `core -` and do not add any area tag for single-area packages.
- For new features, include a short code block in the changelog entry that showcases the new functionality; skip code blocks for simple bug fixes.

### TDD approach

- Always start by defining additional unit tests/updating existing unit tests to fulfill the requirements first. Then make changes to the code accordingly. If you are following the TDD (Test Driven Development) approach, make sure to run the tests and see them fail before implementing the code changes.

## Branch Naming Conventions

### Hotfix / patch releases

For patch releases to previously released versions, push changes to a `release/*` branch:

- **Pattern:** `release/<version>` (e.g., `release/v0.60`, `release/v1.0`)
- A backmerge PR from the release branch to `main` is created automatically
- The publish pipeline triggers on both `main` and `release/*` branches

### Out-of-sync releases

When a standalone package (e.g., `http-client-python`, `http-client-java`) needs an independent release, use a `publish/` branch:

- **Pattern:** `publish/<package>-release-<MM-DD>` (e.g., `publish/python-release-03-26`)
- These branches skip certain CI checks (consistency, external-integration) and auto-publish on merge
- Do **NOT** use `release/*` for standalone package releases — that pattern is reserved for the core TypeSpec lockstep packages

### Regular feature branches

- No enforced naming convention, but use descriptive names (e.g., `fix/openapi3-multipart-union`, `feature/add-xml-support`)

## Available Task Instructions

- [Testserver Generation](./prompts/testserver-generation.md): Instructions for generating TypeSpec HTTP spec test servers
- [http-client-csharp Development](./instructions/http-client-csharp.instructions.md): Instructions for developing the C# HTTP client
- [http-client-java Development](./instructions/http-client-java.instructions.md): Instructions for developing the TypeSpec library for Java client.
- [TCGC Upgrade](./prompts/upgrade-tcgc.instructions.md): Instructions for TCGC version on emitters. Activate with: `tcgc upgrade <emitter-name> <new-version>`
