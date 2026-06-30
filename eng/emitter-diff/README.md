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
   specs ─────────────────────┤                                        ├─► git diff ─► terminal / VS Code / HTML
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

### Common options

By default the tool writes a **clickable HTML report** (`emitter-diff.html`) into the work dir and
prints a `file://` link to it. Use `--vscode` for a live VS Code diff, `--terminal` for the full
patch in your shell, or `--patch`/`--html` to write to a specific file.

| Option                  | Description                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `--name <pattern>`      | Filter which specs/packages are generated                                             |
| `--html <file>`         | Write the rendered HTML report to this path (default: `<work-dir>/emitter-diff.html`) |
| `--vscode`              | Open the diff in VS Code instead of writing HTML                                      |
| `--terminal`            | Print the full colored patch to the terminal instead                                  |
| `--patch <file>`        | Write the raw unified diff to a file                                                  |
| `--fail-on-diff`        | Exit non-zero when output differs (CI gating)                                         |
| `--run-tests`           | Run the adapter's test suites on the output                                           |
| `--test-env <csv>`      | Suites to run, e.g. `test,lint,mypy,pyright`                                          |
| `--test-target <which>` | `head` (default) \| `baseline` \| `both`                                              |
| `--opt key=value`       | Repeatable adapter-specific option (e.g. `--opt flavor=azure`)                        |
| `-- <args>`             | Everything after `--` is forwarded to the adapter                                     |

> `--open` is kept as an alias for `--vscode`.

### Examples

```bash
# Default: writes a clickable emitter-diff.html and prints a file:// link.
npx tsx eng/emitter-diff/src/cli.ts --emitter python --baseline 0.34.0 \
  --opt flavor=azure --name authentication-api-key

# Open the diff live in VS Code instead:
npx tsx eng/emitter-diff/src/cli.ts --emitter python --baseline 0.34.0 \
  --opt flavor=azure --name authentication-api-key --vscode

# Compare two source folders and write an HTML report to a specific path:
npx tsx eng/emitter-diff/src/cli.ts --emitter python \
  --baseline local:/path/to/old/http-client-python \
  --head local:/path/to/new/http-client-python \
  --html diff.html

# Diff against a GitHub sha and run pytest + type checks on the head output:
npx tsx eng/emitter-diff/src/cli.ts --emitter python \
  --baseline github:microsoft/typespec@ \
  test,mypy,pyright --opt flavor=azure --run-tests < sha > --test-env
```

## Viewing the diff in VS Code

`--vscode` gives you a native, side-by-side source diff of the two generated trees. VS Code has
no CLI to diff two _folders_ (`code --diff` only compares two files), so the tool stages the
comparison as a throwaway git working tree under `<work-dir>/vscode-diff`: the **baseline** tree
is committed, the **head** tree is overlaid on top and left staged. Opening that folder shows
every changed generated file in the **Source Control** panel with red/green diffs — click any
file for the side-by-side view.

```bash
# Keep the scratch dir so it survives the run, and open the diff in VS Code:
npx tsx eng/emitter-diff/src/cli.ts --emitter python \
  --baseline npm:0.60.0 --opt flavor=azure --name encode/duration \
  --work-dir ./emitter-diff-out --vscode
```

If you generated the trees without `--vscode` (or want to reopen later), build the same view by
hand from the `baseline/` and `head/` folders under your `--work-dir` and open it in VS Code:

```bash
cd ./emitter-diff-out
git init -q vscode-diff
cp -r baseline/. vscode-diff/
git -C vscode-diff add -A && git -C vscode-diff commit -qm baseline
# overlay head on top, keeping .git
find vscode-diff -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r head/. vscode-diff/
git -C vscode-diff add -A
code vscode-diff # browse changes in the Source Control panel
```

```powershell
# PowerShell equivalent of the overlay step:
cd .\emitter-diff-out
git init -q vscode-diff
Copy-Item -Recurse -Force .\baseline\* .\vscode-diff
git -C vscode-diff add -A; git -C vscode-diff commit -qm baseline
Get-ChildItem .\vscode-diff -Force | Where-Object Name -ne ".git" | Remove-Item -Recurse -Force
Copy-Item -Recurse -Force .\head\* .\vscode-diff
git -C vscode-diff add -A
code vscode-diff
```

## CI integration

`.github/workflows/ci-emitter-diff-python.yml` runs on PRs that touch the python emitter or this
tool. The **approved baseline** is a commit SHA stored in
`eng/emitter-diff/baselines/python.sha`. CI builds the python emitter (and a venv) for both the
PR's checkout and a worktree of that approved commit, diffs the two, and then:

- uploads the rendered **`emitter-diff-html`** artifact (full side-by-side diff; downloadable from
  the workflow run — GitHub artifacts are zip downloads, so they can't be rendered inline in a
  comment),
- writes a job-summary with the diff totals, and
- posts a **sticky PR comment** (updated in place on each push) listing the changed files and
  `+`/`-` counts with a link to download the artifact.

**Approval gate:** if the generated output differs from the approved baseline, the
`--fail-on-diff` run exits with code `2` and the job **fails**. To approve an intended change,
update `eng/emitter-diff/baselines/python.sha` to a commit on your branch that contains your
emitter changes, then push. Once the baseline SHA points at a commit whose emitter matches the
PR's emitter, the diff is empty and the check passes.

The comment step needs `pull-requests: write`. PRs **from forks** get a read-only token, so the
comment is best-effort there (`continue-on-error`) — the artifact and job-summary still work.

## Adding a new language adapter

1. Implement `EmitterAdapter` (`src/types.ts`) — `prepareEmitter`, `generate`, optional `runTests` —
   wrapping that emitter's own commands (e.g. rust's `npm run tspcompile`, ts's `gen-spector`).
2. Register it in `src/registry.ts`.

The core needs no changes.

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
