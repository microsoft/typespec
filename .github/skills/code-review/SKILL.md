---
name: code-review
description: >
  Review TypeSpec pull requests against the project's own rules: the Tier 0-3 breaking change
  policy, `.chronus` changelog requirements, compiler API usage, test framework conventions, and
  emitter output stability. Use when reviewing a diff or pull request in this repository.
---

# TypeSpec code review

Review the diff against the rules this project actually enforces. Every comment must point at a
concrete problem in the changed code and cite the rule or code that makes it a problem — if you
cannot cite it, do not post it.

## Scope

Applies to the whole repository: the pnpm workspace packages (`packages/compiler`, `packages/http`,
`packages/openapi3`, `packages/json-schema`, `packages/versioning`, …), the language emitter
packages (`packages/http-client-{csharp,java,python}`), `.chronus/changes/**`, and their tests.

For the language emitter packages, §1 (tier policy) does not apply to their internal APIs and their
own rules in `.github/instructions/*.instructions.md` take precedence — but §2 (changeset), §3
(compiler API usage) and §4 (tests) apply everywhere.

Out of scope — do not comment on:

- Generated artifacts: `pnpm-lock.yaml`, generated Python/C#/Java code under `generator/`,
  `tests/generated/`, and generated reference docs under
  `website/src/content/docs/docs/libraries/*/reference/**`.
- Formatting and lint-covered issues — prettier (`pnpm format`) and oxlint own those.
- Naming/style preferences, or unchanged code surrounding the diff.

## Read before judging

Consult these and cite them in findings:

- `website/src/content/docs/docs/handbook/breaking-change-policy.mdx` — the authoritative tier table
  and the bug exception.
- `.chronus/config.yaml` — the valid `changeKind` values and the `changedFiles` exclusions.
- `.github/copilot-instructions.md` — changelog message guidelines and the TDD expectation.
- Sibling tests in the touched package — the established tester/assertion patterns.
- The public compiler API (`@typespec/compiler`) and `@typespec/compiler/testing` exports — to
  confirm a used API exists and behaves as the change assumes.

## 1. Breaking changes and public surface

Decide which tier each change touches, then whether it breaks an _existing_ spec or consumer.
Adding new syntax, types, or capabilities is not breaking; changing how something that already
worked behaves is.

- **Tier 0 — language syntax/semantics, the type graph (`Type`), default TypeKits, exported helper
  and accessor functions.** Flag: an existing valid spec that now parses differently, fails, or
  produces a different type graph; a removed/renamed export or changed signature; a changed runtime
  result for existing input; a removed or repurposed field on a `Type`. Adding a _required_ field to
  a `Type` is allowed by policy but breaks downstream construction — call it out.
- **Tier 1 — the AST (`Node`, `SyntaxKind`).** Appended enum members and new union variants are
  allowed (TypeScript exhaustiveness errors are explicitly not breaking). Flag renumbered enums
  (members inserted rather than appended), removed node kinds, and changed shapes of existing nodes.
- **Tier 2 — checker, symbols, `@internal` / `/internals` / `/experimental` exports, template
  declarations, stdout/stderr output.** Not breaking; mention only if a change here silently alters
  observable behavior.
- **Tier 3 — formatter and emitter output.** Semantically equivalent output changes are not
  breaking; see §5 for the risk that matters.
- **Bug exception.** A technically breaking change that fixes clearly unintended behavior is not a
  breaking change — but say so explicitly rather than staying silent.

A change you judge breaking that has no `breaking` changeset is the highest-value finding in a
review. Raise it first.

## 2. Changeset (`.chronus`)

- Valid `changeKind` values are exactly: `internal`, `fix`, `dependencies`, `feature`,
  `deprecation`, `breaking`. Anything else (`feat`, `docs`, `patch`, `minor`, `major`) is invalid.
- The kind must match reality: a new capability is `feature`, a fix is `fix`, and anything breaking
  per §1 is `breaking`.
- One entry **per package and per change type**. A single entry bundling a feature in one package
  with a fix in another must be split.
- `packages:` must list exactly the affected packages.
- Every package with a user-visible change needs an entry. Missing one is a finding — but note the
  exclusions in `.chronus/config.yaml`: `**/*.md`, test files, and `packages/*/test/**` don't
  require a changeset, so docs-only or test-only changes legitimately have none.
- Message quality: describes the change from the user's perspective; area tag only when targeting a
  secondary area of a multi-area package, in `[bracket]` form (e.g. `[converter]`, `[formatter]`) —
  no generic `core -` prefixes; a `feature` entry includes a short illustrative code block, a simple
  fix does not.

## 3. Compiler API usage

Judge whether the change uses the TypeSpec compiler API the way the compiler expects, not merely
whether it type-checks.

- **Diagnostic targets decide whether a diagnostic can be suppressed.** A diagnostic reported with `NoTarget` can never be
  suppressed (`packages/compiler/src/core/program.ts` — `target === NoTarget` returns early before
  the `#suppress` lookup), and a diagnostic with `severity: "error"` can never be suppressed either
  (suppressing one produces `suppress-error`). So a diagnostic the user is meant to be able to
  silence must be a `warning` **and** carry a real node/type target. Flag any target that resolves
  to `NoTarget` on a realistic input as "not actually suppressible".
- **Pick the most precise target available**, falling back deliberately: the offending type → the
  service namespace → `program.getGlobalNamespaceType()` → `NoTarget` only for genuinely
  program-wide failures with no node to point at.
- **Don't assume the program has a service.** `listServices(program)` returns a possibly empty
  array; `[0]` is `undefined` for model-only or service-less programs. Same for any lookup that can
  return `undefined` — ask what happens in that case, and whether the diagnostic is still reachable
  and suppressible there.
- **Severity changes have control-flow consequences.** `error` blocks emission via
  `program.hasError()`; downgrading to `warning` means everything downstream now runs in a state it
  previously never saw. Verify the continue path is safe and intended.
- **Diagnostic hygiene.** Report through the library's `reportDiagnostic`/`createDiagnostic` with a
  catalog entry and stable code; never `throw` for a user error. The message text must still match
  the behavior after the change — a message saying the emitter "requires" something it now merely
  warns about is a finding.
- **Prefer stable public APIs.** Use exported helpers and TypeKits over the checker, symbols, or AST
  (Tier 2, see §1); use `resolvePath`/`joinPaths` rather than `node:path`; exclude template
  declarations with `isTemplateDeclaration` when navigating types.

## 4. Tests

- Every new code path, branch, diagnostic, and public API needs a test co-located in the package's
  `test/**`. New behavior with no test is a finding.
- **Reuse the package's shared tester.** Packages export one from `test/test-host.ts` or
  `test/tester.ts` (e.g. `packages/http/test/test-host.ts`, `packages/compiler/test/tester.ts`).
  Calling `createTester(...)` inline in a new test file duplicates library/import setup and drifts —
  flag it and point at the existing module.
- **Assert diagnostics with the helpers.** Use `expectDiagnostics` / `expectDiagnosticEmpty` from
  `@typespec/compiler/testing`, not hand-rolled checks like
  `program.diagnostics.some((x) => x.code.endsWith(...))`, which silently pass when the code,
  severity, or target is wrong.
- **Exercise the real entrypoint.** A test must drive the shipped path (`$onEmit`, the decorator,
  the emitter run) rather than re-implement the logic or call a helper in isolation — otherwise it
  passes while the actual behavior is broken.
- **Verify imports resolve.** If a test imports a helper from `src`, confirm that symbol is actually
  exported there; an import of a non-existent export makes the whole file fail to load.
- Tests must be meaningful: they should fail if the change were reverted. Flag tests that only smoke
  run or assert nothing specific to the new behavior.
- Beyond the happy path: error and diagnostic paths, empty/anonymous forms, templates, and negative
  cases — including the fallback branches identified in §3.
- Flag any weakening of existing coverage: `.skip`/`.only`, deleted assertions, or matchers
  broadened to make a change pass.

## 5. Emitter output stability

For `packages/{openapi3,openapi,json-schema,http,http-server-*}`:

- **Unexplained snapshot changes are the headline risk.** Every changed snapshot must be an
  intentional, explained consequence of the change. A snapshot diff for specs unrelated to the
  feature means existing users' output changed — raise it.
- Inline-vs-hoist, component naming, and declaration-creation changes must preserve behavior for
  existing named types and only affect genuinely new inputs. Anonymous/empty-named types inline;
  named types hoist without key collisions.
- `$ref` and component-key correctness: reordering name validation relative to ref generation must
  not silently drop validation that previously errored — if that is an intended fix, it needs to be
  called out and changeset'd.
- Emitters must handle new type-graph shapes defensively (new node kinds, new union variants)
  rather than crash on them.

## How to comment

- One issue per comment, anchored on the offending line.
- State the problem, cite the rule (policy section, `.chronus/config.yaml`, guideline) or the
  relevant `file:line`, and suggest the concrete fix.
- One or two sentences. No preamble, no summarizing the diff back to the author.
- Don't repeat a point another comment already makes.
- Lead with correctness, compatibility, and coverage. Minor suggestions are welcome only when they
  are actionable and specific.
