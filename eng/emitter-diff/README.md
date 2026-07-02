# emitter-diff

A language-agnostic tool for **diffing the generated code produced by two versions of a
TypeSpec emitter**.

It generates code from the test specs twice (a **baseline** emitter and a **head** emitter),
then shows the diff between the two outputs. Use it locally during development and in CI on PRs.

Each language emitter plugs in via a small **adapter** that
wraps that emitter's own generation command. The core (ref resolution, diffing, orchestration)
contains no language-specific logic.

## How it works

```text
            baseline emitter ─┐
                              ├─ generate ─► <work>/baseline ─┐
   specs ─────────────────────┤                                        ├─► git diff ─► terminal / HTML
                              ├─ generate ─► <work>/head ─────┘
            head emitter ─────┘
```

- The **adapter** wraps the emitter's existing commands. For python that is
  `packages/http-client-python/eng/scripts/ci/regenerate.ts` (generation).
- The regenerate _driver_ always comes from the current checkout; only the emitter build it points
  at (`--pluginDir`) changes between baseline and head, isolating the diff to emitter behavior.

## Usage

```bash
# Run directly with Node 24+ (native TypeScript, no build step, no dependencies):
node eng/emitter-diff/src/cli.ts --emitter python
```

> This tool is a set of plain `.ts` scripts — not an installed package. Node 24 runs TypeScript
> natively, so there is nothing to build or install. Typecheck with `npx tsc -p eng/emitter-diff`.

### Refs

#### Emitter refs (`--baseline`, `--head`)

| Syntax                            | Meaning                                |
| --------------------------------- | -------------------------------------- |
| `npm:1.2.3` or `1.2.3`            | a published package version (prebuilt) |
| `local:/path` or `./path`         | a local source folder                  |
| `github:owner/repo@<sha\|branch>` | a GitHub source at a ref               |
| `gh:<sha\|branch>`                | `microsoft/typespec` at a ref          |

`--head` defaults to the **current checkout**. `--baseline` defaults to `gh:upstream/main` when present, otherwise `gh:origin/main` (`origin/HEAD` as a fallback).

Use `--name` to filter which packages/specs are generated.

### Common options

By default the tool writes a **clickable HTML report** (`emitter-diff.html`) into the work dir and
prints a `file://` link to it. Use `--html` to write to a specific file.

- `--name <pattern>`: Filter which specs/packages are generated.
- `--html <file>`: Write the rendered HTML report to this path (default: `<work-dir>/emitter-diff.html`).
- `--generated-code-path <path>`: Override the adapter generated-code subpath under each side output root.
- `--fail-on-diff`: Exit non-zero when output differs (CI gating).

### Examples

```bash
# Explicit baseline version:
node eng/emitter-diff/src/cli.ts --emitter python --baseline 0.34.0 --name authentication-api-key

# Compare two source folders and write an HTML report to a specific path:
node eng/emitter-diff/src/cli.ts --emitter python --baseline local:/path/to/old/http-client-python \
  --head local:/path/to/new/http-client-python \
  --html diff.html

# Override the adapter generated-code subpath under each side output root:
node eng/emitter-diff/src/cli.ts --emitter python --generated-code-path tests/generated

# Diff against a GitHub sha:
node eng/emitter-diff/src/cli.ts --emitter python \
  --baseline github:microsoft/typespec@<sha>
```

## CI integration

`.github/workflows/ci-emitter-diff-<lang>.yml` runs on PRs that touch the language emitter or this tool. The **baseline** is the base-branch commit the PR is based on (the `git merge-base` with the target branch). CI builds the emitter for both the PR's checkout and a worktree
of that merge-base commit, diffs the two, and then:

- posts a **sticky PR comment** (updated in place on each push) with the link to download the diff artifact.

**Informational:** the check **always passes unless the tool hits a real tool/build error** — a
generated-output diff does not fail the PR. CI runs the tool without `--fail-on-diff`, so a diff
still exits `0`; only a non-zero exit (a build/venv/generate failure) fails the job. Reviewers use
the PR comment and the HTML artifact to eyeball the diff.

The comment step needs `pull-requests: write`. PRs **from forks** get a read-only token, so the
comment is best-effort there (`continue-on-error`) — the artifact and job-summary still work.

## Adding a new language adapter

1. Implement `EmitterAdapter` (`src/types.ts`) — `prepareEmitter` and `generate` — wrapping that
   emitter's own commands (e.g. rust's `npm run tspcompile`, ts's `gen-spector`).
2. Register it in `src/registry.ts`.

That's the only wiring needed — the orchestrator, ref resolver, and diff engine are
language-agnostic and require no changes.

## Notes & limitations

- For the current python regenerate flow, spec inputs come from each side's
  dependencies (`node_modules/@typespec/http-specs` and
  `node_modules/@azure-tools/azure-http-specs`). Use `--name` to filter.
- `--html` renders a self-contained, GitHub-style HTML report (inline CSS, no external requests).
  The tool has **zero runtime dependencies** — the diff itself is `git diff --no-index`.
- For github refs (including fork repos), the resolver uses a detached, commit-keyed cached git
  worktree under the temp directory, created from an isolated cache repo (not from your active
  checkout). That keeps each version's build/venv isolated and allows repeated runs on the same
  commit to reuse existing setup work.
- **Python's native two-phase pipeline needs a venv per emitter version.** `regenerate.ts`
  compiles TypeSpec to YAML in-process and then runs a batched Python subprocess
  (`eng/scripts/setup/run_batch.py`) that writes the `.py` files using a venv co-located with the
  emitter at `<emitter>/venv`. The adapter therefore builds **and** creates a venv (`npm run
install`) for each side before generating. Because each version's venv is built from that
  version's generator, a baseline must be a buildable **source** ref (`local`/`github`) or an npm
  version whose package can run `npm run install`; the CI workflow uses a worktree of the PR base
  commit as the baseline.
