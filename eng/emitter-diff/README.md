# emitter-diff

A language-agnostic tool for **diffing the generated code produced by two versions of a
TypeSpec emitter**.

It runs the emitter's own regenerate command against a **baseline** source tree and a **head**
source tree, then shows the diff between the two generated outputs. Use it locally during
development and in CI on PRs.

The tool contains **zero language logic**. An emitter integrates by naming three things — its
regenerate command, the package directory to run it in, and the generated-code directory to diff —
either as flags or via a built-in `--emitter` preset.

## How it works

```text
   baseline tree ─► run <command> in <emitter-path> ─► snapshot <generated-code-path> ─┐
                                                                                        ├─► git diff ─► terminal / HTML
   head tree ─────► run <command> in <emitter-path> ─► snapshot <generated-code-path> ─┘
```

- A **source tree** is resolved for each side (`--baseline` / `--head`).
- The **`--command`** is run verbatim (tokenized to argv — no shell) inside
  `<tree>/<emitter-path>`. This is the emitter's _unmodified_ regenerate command; the tool does
  not reach into it.
- The `<emitter-path>/<generated-code-path>` subtree is snapshotted for each side and the
  two snapshots are diffed.

Because the tool just runs a command, **any emitter with a regenerate script works** — no per-language
plugin code.

## Usage

```bash
# Using a built-in preset (fills in command + paths):
node eng/emitter-diff/src/cli.ts --emitter python --baseline gh:<sha>

# Fully explicit (no preset needed):
node eng/emitter-diff/src/cli.ts \
  --command "npm run regenerate" \
  --emitter-path packages/http-client-python \
  --generated-code-path tests/generated \
  --baseline gh:<sha>
```

> This tool is a set of plain `.ts` scripts — not an installed package. It runs through `node`
> (which executes TypeScript directly on the versions this repo supports), so there is nothing to
> build. Typecheck with `npx tsc -p eng/emitter-diff`.

> **Build your checkout first.** `--head` defaults to the current working tree, and the tool runs
> the regenerate command against it **as-is** — it never installs or builds your checkout (see
> [Command prep](#command-prep---setup)). Build the emitter for the head side before diffing; for
> **python** that's `npm run setup` in `packages/http-client-python` (builds the emitter and creates
> the venv `regenerate` requires). Only trees the tool fetches from GitHub are auto-prepared.

### Emitter config

| Flag                           | Meaning                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `--emitter <name>`             | Built-in preset that fills in the three fields below.        |
| `--command <cmd>`              | Regenerate command, run verbatim in `--emitter-path`.        |
| `--emitter-path <path>`        | Package dir (relative to a tree root) to run the command in. |
| `--generated-code-path <path>` | Generated-code dir (relative to `--emitter-path`) to diff.   |

A preset supplies all three; each flag still overrides the preset value. To onboard a new language,
add a row to `EMITTER_DEFAULTS` in `src/registry.ts` — or just pass the three flags directly and
skip `--emitter`.

### Refs

| Syntax                            | Meaning                              |
| --------------------------------- | ------------------------------------ |
| `local:/path` or `./path`         | a local source folder (run in place) |
| `github:owner/repo@<sha\|branch>` | a GitHub source at a ref             |
| `gh:<sha\|branch>`                | this repo (origin remote) at a ref   |

`--head` defaults to the **current working tree**. `--baseline` defaults to the `upstream` remote's
repo at its default branch, falling back to `origin` (e.g. `github:microsoft/typespec@main`).

### Command prep (`--setup`)

The `--command` is run **as-is** — it does not install deps or build. Instead, prep is handled by
**`--setup`**, which runs **only in a tree the tool freshly fetched from GitHub** (a `gh:`/`github:`
ref). The current working tree and user-provided `local:` paths are assumed already built and are
**never touched** (so setup never mutates your checkout or a prepared CI worktree).

- A **preset** supplies sensible setup defaults, so `--emitter python --baseline gh:main` installs +
  builds the fetched baseline automatically (python: `npm install --ignore-scripts` → `npm run setup`;
  typescript: `pnpm install` → `npm run build`).
- Override with one or more `--setup <cmd>` (each runs in order, in `<tree>/<emitter-path>`), or
  disable entirely with `--no-setup`.

Each `--setup` command — like `--command` — is tokenized to argv and run **without a shell**, so
multi-step pipelines (`&&`, `|`) are not supported; pass repeated `--setup` flags instead.

### Common options

By default the tool writes a **clickable HTML report** (`emitter-diff.html`) into the work dir and
prints a `file://` link to it.

- `--baseline <ref>` / `--head <ref>`: the two source trees to compare.
- `--setup <cmd>` (repeatable) / `--no-setup`: prep commands for freshly fetched GitHub trees.
- `--work-dir <dir>`: scratch dir for snapshots (default: a fresh temp dir).
- `--sequential`: regenerate baseline then head one after another instead of in parallel. Useful on
  a single machine where running both at once oversubscribes the CPU (each regenerate already fans
  out across cores) or trips generator races.
- `--ci`: disable the local baseline-output cache (intended for CI).
- `--html <file>`: write the rendered HTML report to this path.
- `--md <file>`: write a Markdown report (collapsible per-file `diff` blocks) to this path. Handy for
  a CI job summary (`$GITHUB_STEP_SUMMARY`) or a PR comment body.
- `--fail-on-diff`: exit non-zero when output differs (exit `2` = diff present, `1` = hard error).
- `-- <args>`: everything after `--` is appended to `--command` verbatim on **both** sides, so the
  diff stays apples-to-apples. Use it to regenerate only a subset of tests by forwarding the
  regenerate script's own filter flags.

### Regenerating a subset of tests

The tool doesn't define its own test-filter flags — it forwards `-- <args>` to each emitter's
regenerate command, which owns the filtering. For the **Python** emitter (`regenerate.ts`):

- `-n, --name <pattern>`: case-insensitive substring match on package name.
- `-f, --flavor <azure|unbranded>`: limit to one flavor.
- `-j, --jobs <n>`: parallel job count.

```sh
# Only the authentication packages, azure flavor
node ../../eng/emitter-diff/src/cli.ts --emitter python -- --name authentication --flavor azure

# Via the package script (first `--` is npm's, second is emitter-diff's passthrough separator)
npm run diff-spector-tests -- -- --name type/array
```

`--name` filters the spec set already bundled in the package's `node_modules`
(`@azure-tools/azure-http-specs` + `@typespec/http-specs`); it does not point the test set at an
arbitrary folder or ref. Other emitters expose their own filter flags — pass whatever their
regenerate command accepts.

## CI integration

`.github/workflows/ci-emitter-diff-<lang>.yml` runs on PRs that touch the language emitter or this
tool. The **baseline** is the base-branch commit the PR is based on (the `git merge-base` with the
target branch). Because the tool runs the regenerate command as-is, the workflow **prepares both
trees** (installs deps, builds the emitter, creates any venv) before invoking the tool, then:

- posts a **sticky PR comment** (updated in place on each push) linking the diff artifact, and
- uploads the rendered **HTML report** as an artifact.

**Informational:** the check **always passes unless the tool hits a real tool/build error** — a
generated-output diff does not fail the PR. CI runs the tool without `--fail-on-diff`, so a diff
still exits `0`; only a non-zero exit (a build/venv/generate failure) fails the job.

The comment step needs `pull-requests: write`. PRs **from forks** get a read-only token, so the
comment is best-effort there (`continue-on-error`) — the artifact and job summary still work.

## Adding a new language

Either add a preset row to `EMITTER_DEFAULTS` (`src/registry.ts`):

```ts
rust: {
  command: "npm run tspcompile",
  emitterPath: "packages/typespec-rust",
  generatedCodePath: "test/generated",
},
```

…or skip the preset entirely and pass `--command` / `--emitter-path` /
`--generated-code-path` directly. Either way, ensure each side's tree can actually run the
command (see **Command prep** above). The orchestrator, ref resolver, and diff engine need no
changes.

## Notes & limitations

- `--html` renders a self-contained, GitHub-style HTML report (inline CSS, no external requests).
  `--md` renders a Markdown report (collapsible per-file `diff` blocks) suitable for a CI job
  summary or PR comment. The diff itself is produced by `git diff --no-index`; the tool leans on
  only a couple of small repo dev dependencies (`execa`, `picocolors`) for process spawning and
  terminal coloring.
- For github refs (including fork repos), the resolver uses a detached, commit-keyed cached git
  worktree under the temp directory, created from an isolated cache repo (not from your active
  checkout). Repeated runs on the same commit reuse it.
- Spec inputs come from each side's own dependencies (e.g. `node_modules/@typespec/http-specs`).
  Spec versions rarely change, so any drift between baseline/head is treated as acceptable noise.
