# @typespec/emitter-diff

A language-agnostic tool for **diffing the generated code produced by two versions of a
TypeSpec emitter** — and optionally running that emitter's generated-code test suites.

It generates code from the test specs twice (a **baseline** emitter and a **head** emitter),
then shows the diff between the two outputs. Use it locally during development and in CI on PRs.

Each language emitter (python, and later java/rust/go/ts) plugs in via a small **adapter** that
wraps that emitter's own generation/test commands. The core (ref resolution, diffing, orchestration)
contains no language-specific logic.

## How it works

```
            baseline emitter ─┐
                              ├─ generate (adapter) ─► <work>/baseline ─┐
   specs ─────────────────────┤                                        ├─► git diff ─► terminal / HTML
                              ├─ generate (adapter) ─► <work>/head ─────┘
            head emitter ─────┘                                        └─► (optional) run test suites
```

- The **adapter** wraps the emitter's existing commands. For python that is
  `packages/http-client-python/eng/scripts/ci/regenerate.ts` (generation) and
  `eng/scripts/ci/run-tests.ts` (suites).
- The regenerate _driver_ always comes from the current checkout; only the emitter build it points
  at (`--pluginDir`) changes between baseline and head, isolating the diff to emitter behavior.

## Usage

```bash
# From the repo root, via pnpm:
pnpm --filter @typespec/emitter-diff exec tsx src/cli.ts --emitter python --baseline 0.34.0

# Or directly with Node 22+ (native TS):
npx tsx eng/emitter-diff/src/cli.ts --emitter python --baseline 0.34.0
```

### Refs (`--baseline`, `--head`, `--specs`)

| Syntax                            | Meaning                                |
| --------------------------------- | -------------------------------------- |
| `npm:1.2.3` or `1.2.3`            | a published package version (prebuilt) |
| `local:/path` or `./path`         | a local source folder                  |
| `github:owner/repo@<sha\|branch>` | a GitHub source at a ref               |
| `gh:<sha\|branch>`                | the current repo at a ref              |

`--head` defaults to the **current checkout**. `--specs` defaults to **all** repo specs.

> `--baseline`/`--head` accept all three ref kinds. `--specs` accepts **local** or **github**
> refs only (npm versions aren't a valid spec source) — an `npm:` spec ref is rejected.

### Common options

By default the tool writes a **clickable HTML report** (`emitter-diff.html`) into the work dir and
prints a `file://` link to it. Use `--terminal` for the full patch in your shell, or
`--patch`/`--html` to write to a specific file.

| Option                  | Description                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `--name <pattern>`      | Filter which specs/packages are generated                                             |
| `--html <file>`         | Write the rendered HTML report to this path (default: `<work-dir>/emitter-diff.html`) |
| `--terminal`            | Print the full colored patch to the terminal instead                                  |
| `--patch <file>`        | Write the raw unified diff to a file                                                  |
| `--fail-on-diff`        | Exit non-zero when output differs (CI gating)                                         |
| `--run-tests`           | Run the adapter's test suites on the output                                           |
| `--test-env <csv>`      | Suites to run, e.g. `test,lint,mypy,pyright`                                          |
| `--test-target <which>` | `head` (default) \| `baseline` \| `both`                                              |
| `--opt key=value`       | Repeatable adapter-specific option (e.g. `--opt flavor=azure`)                        |
| `-- <args>`             | Everything after `--` is forwarded to the adapter                                     |

### Examples

```bash
# Default: writes a clickable emitter-diff.html and prints a file:// link.
npx tsx eng/emitter-diff/src/cli.ts --emitter python --baseline 0.34.0 \
  --opt flavor=azure --name authentication-api-key

# Compare two source folders and write an HTML report to a specific path:
npx tsx eng/emitter-diff/src/cli.ts --emitter python \
  --baseline local:/path/to/old/http-client-python \
  --head local:/path/to/new/http-client-python \
  --html diff.html

# Diff against a GitHub sha and run pytest + type checks on the head output:
npx tsx eng/emitter-diff/src/cli.ts --emitter python \
  --baseline github:microsoft/typespec@ \
  --test-env test,mypy,pyright --opt flavor=azure < sha > --run-tests
```

## CI integration

`.github/workflows/ci-emitter-diff-python.yml` runs on PRs that touch the python emitter or this
tool. The **baseline** is the base-branch commit the PR is based on (the `git merge-base` with the
target branch) — always a real commit on the target branch, so it survives squash-merge, rebase,
and force-push. CI builds the python emitter (and a venv) for both the PR's checkout and a worktree
of that merge-base commit, diffs the two, and then:

- uploads the rendered **`emitter-diff-html`** artifact (full side-by-side diff; downloadable from
  the workflow run — GitHub artifacts are zip downloads, so they can't be rendered inline in a
  comment),
- writes a job-summary with the diff totals, and
- posts a **sticky PR comment** (updated in place on each push) with the changed-file and `+`/`-`
  counts and a link to download the artifact.

**Approval gate:** if the generated output differs from the baseline, the `--fail-on-diff` run
exits with code `2` and the job **fails until the change is approved**. To approve an intended
change, add the **`emitter-diff-approved`** label to the PR. The label — not a committed SHA — is
the approval token, so it is unaffected by history rewrites; the workflow also triggers on
`labeled`/`unlabeled`, so adding or removing the label re-runs the check automatically.

The comment step needs `pull-requests: write`. PRs **from forks** get a read-only token, so the
comment is best-effort there (`continue-on-error`) — the artifact and job-summary still work.

## Adding a new language adapter

1. Implement `EmitterAdapter` (`src/types.ts`) — `prepareEmitter`, `generate`, optional `runTests` —
   wrapping that emitter's own commands (e.g. rust's `npm run tspcompile`, ts's `gen-spector`).
2. Register it in `src/registry.ts`.

That's the only wiring needed — the orchestrator, ref resolver, and diff engine are
language-agnostic and require no changes.

## Notes & limitations

- External `--specs` folders must mirror the `http-specs` / `azure-http-specs` layout.
- `--html` uses the optional `diff2html` dependency (declared in this package's `package.json`).
- **Python's native two-phase pipeline needs a venv per emitter version.** `regenerate.ts`
  compiles TypeSpec to YAML in-process and then runs a batched Python subprocess
  (`eng/scripts/setup/run_batch.py`) that writes the `.py` files using a venv co-located with the
  emitter at `<emitter>/venv`. The adapter therefore builds **and** creates a venv (`npm run
install`) for each side before generating. Because each version's venv is built from that
  version's generator, a baseline must be a buildable **source** ref (`local`/`github`) or an npm
  version whose package can run `npm run install`; the CI workflow uses a worktree of the PR base
  commit as the baseline.
