---
name: generate-from-typespec
description: >
  Generate Python SDK code from a TypeSpec specification using the local emitter.
  Use this skill when the user wants to generate/regenerate a Python client from
  a TypeSpec spec, provides a GitHub URL or local path to a TypeSpec project, or
  says things like "generate from this spec", "emit Python from this tsp",
  "regenerate the SDK", or "compile this TypeSpec for Python".
---

# Generate From TypeSpec Skill

Compiles a TypeSpec specification using the **local** `@typespec/http-client-python`
emitter and generates Python SDK code. Supports both branded (`@azure-tools/typespec-python`)
and unbranded (`@typespec/http-client-python`) generation.

## Inputs

The caller must provide:

1. **Spec path** — either:
   - A **local file path** to a `.tsp` entry point (e.g., `client.tsp`, `main.tsp`)
   - A **raw GitHub URL** pointing to a TypeSpec project directory or file
     (e.g., `https://github.com/Azure/azure-rest-api-specs/tree/main/specification/.../Foundry/src/sdk-service-agentserver-contracts/client.tsp`)
2. **Flavor** — `azure` (branded) or `unbranded`. If not provided, ask the user.
3. **Emitter output directory** — the full resolved path where generated code
   should be written (e.g., `~/Desktop/github/azure-sdk-for-python/sdk/agentserver/azure-ai-agentserver-responses`).
   If not provided, ask the user.
4. **Additional options** (optional) — any extra `key=value` emitter options the
   user wants applied on top of the tspconfig options. These override tspconfig
   values if there's a conflict (e.g., `models-mode=typeddict`).

## Workflow

### Step 1: Resolve the spec path

**If the input is a GitHub URL:**

1. Parse the URL to extract `owner`, `repo`, `ref` (branch/commit), and `path`.
2. Check if the repository is cloned locally (look under common locations like
   `~/Desktop/github/<repo-name>`, `~/<repo-name>`, etc.).
3. If found locally, check out the correct ref/commit if needed:
   ```bash
   cd <local-repo>
   git fetch origin <ref>
   git checkout <ref> -- <path-to-spec-dir>/
   ```
4. If not found locally, ask the user where the repo is cloned, or offer to clone it.

**If the input is a local path:**

Verify the file/directory exists. If the path points to a directory, look for
`client.tsp` or `main.tsp` as the entry point.

### Step 2: Locate and parse `tspconfig.yaml`

Look for `tspconfig.yaml` in the same directory as the spec entry point, then
walk up parent directories until one is found.

```bash
# Starting from the spec file's directory, search for tspconfig.yaml
current_dir="<spec-dir>"
while [ "$current_dir" != "/" ]; do
  if [ -f "$current_dir/tspconfig.yaml" ]; then
    echo "Found: $current_dir/tspconfig.yaml"
    break
  fi
  current_dir=$(dirname "$current_dir")
done
```

### Step 3: Extract Python emitter options from tspconfig.yaml

Parse the `tspconfig.yaml` and extract the options block for the Python emitter.
The emitter may appear under either name:

| Flavor    | Emitter key in tspconfig.yaml        |
| --------- | ------------------------------------ |
| Branded   | `@azure-tools/typespec-python`       |
| Unbranded | `@typespec/http-client-python`       |

**Important cross-flavor rule:** If the user requests a different flavor than
what's in the tspconfig, carry over ALL options from the tspconfig's Python
emitter block. For example:

- tspconfig has options under `@azure-tools/typespec-python` but user wants
  **unbranded** → use all those options, but emit under `@typespec/http-client-python`
- tspconfig has options under `@typespec/http-client-python` but user wants
  **branded** → use all those options, but emit under `@azure-tools/typespec-python`

If no Python emitter options exist in the tspconfig at all, ask the user for:
- `emitter-output-dir` (required — where to write the generated code)
- `package-name` (required)
- `namespace` (optional — omit to let `@clientNamespace` decorators resolve naturally)

### Step 4: Determine the flavor

Use this precedence:

1. If the user explicitly stated `azure` or `unbranded`, use that.
2. If the tspconfig has a `flavor` option set, mention it to the user and confirm.
3. If the tspconfig only has one Python emitter key, infer:
   - `@azure-tools/typespec-python` → `azure`
   - `@typespec/http-client-python` → `unbranded`
4. If still ambiguous, **ask the user**:
   > "Should I generate as branded (azure flavor) or unbranded?"

### Step 5: Find the TypeSpec compiler

Look for the `tsp` CLI in the spec repo's `node_modules`:

```bash
# Check spec repo root for compiler
<spec-repo-root>/node_modules/@typespec/compiler/cmd/tsp.js
```

If not found, fall back to the global `tsp` command, or check the typespec
monorepo's compiler:

```bash
~/Desktop/github/typespec/packages/compiler/cmd/tsp.js
```

### Step 6: Construct and run the compile command

Build the `tsp compile` command using:

- **Entry point**: The resolved `.tsp` file from Step 1
- **`--emit`**: Always the local emitter path:
  `~/Desktop/github/typespec/packages/http-client-python`
- **`--option` flags**: One for each option from the tspconfig, prefixed with
  the **local emitter name** `@typespec/http-client-python` (regardless of
  what the tspconfig called it). Any additional options provided by the user
  are appended last and override tspconfig values if there's a conflict.

**Template:**

```bash
<tsp-cli-path> compile <entry-point.tsp> \
  --emit ~/Desktop/github/typespec/packages/http-client-python \
  --option "@typespec/http-client-python.<key1>=<value1>" \
  --option "@typespec/http-client-python.<key2>=<value2>" \
  ...
```

**Option mapping rules:**

| tspconfig key            | CLI `--option` key       | Notes                                              |
| ------------------------ | ------------------------ | -------------------------------------------------- |
| `emitter-output-dir`     | `emitter-output-dir`     | Resolve `{output-dir}`, `{service-dir}` variables  |
| `package-mode`           | `package-mode`           | Usually `dataplane` or `mgmt`                      |
| `package-name`           | `package-name`           |                                                    |
| `namespace`              | `namespace`              | **Omit if not in tspconfig** — see note below       |
| `api-version`            | `api-version`            |                                                    |
| `flavor`                 | `flavor`                 | Set to `azure` for branded, omit for unbranded     |
| `generate-test`          | `generate-test`          |                                                    |
| `generate-sample`        | `generate-sample`        |                                                    |
| `models-mode`            | `models-mode`            | e.g., `dpg`, `msrest`, `typeddict`                 |
| Any other option         | Pass through as-is       |                                                    |

**Namespace note:** Do NOT pass `--namespace` unless it is explicitly set in the
tspconfig or by the user. When omitted, the emitter lets TCGC resolve
`@clientNamespace` decorators correctly. Passing a namespace when `@clientNamespace`
is used in the spec can cause incorrect directory nesting.

**`emitter-output-dir`:** Always use the value provided by the user (Input #3).
Ignore the `emitter-output-dir` from the tspconfig — it typically contains
unresolvable template variables like `{output-dir}` and `{service-dir}`.

### Step 7: Run the compilation

```bash
cd <spec-directory>
<constructed-compile-command>
```

Set a timeout of at least 180 seconds — compilation can take a few minutes.

Check the output:
- **Warnings only** → success
- **Errors** → report to the user with the full error output

### Step 8: Verify and clean up

After successful compilation:

1. Show the generated directory structure:
   ```bash
   find <output-dir> -type d | sort
   ```

2. Verify the output matches expectations (e.g., TypedDict if `models-mode=typeddict`).

3. If the generation overwrote files in an existing package, warn the user and
   offer to revert non-generated files:
   ```bash
   cd <sdk-repo>
   git diff --name-status <package-dir>/ | grep -v "<expected-generated-path>"
   ```

## Notes

### The `--namespace` trap

When a TypeSpec uses `@clientNamespace` to map types into a different namespace,
TCGC resolves the namespace. If you also pass `--namespace`, TCGC tries to
replace the root of the `@clientNamespace` value with the flag, which can produce
doubled prefixes like `azure.azure.ai.projects...`. **Only pass `--namespace`
when the tspconfig explicitly sets it.**

### Branded vs unbranded emitter names

The local emitter is always `@typespec/http-client-python` on the CLI `--emit`
and `--option` flags. The `flavor` option controls branded behavior:

- **Branded**: `--option "@typespec/http-client-python.flavor=azure"`
- **Unbranded**: omit the `flavor` option entirely

### Common additional options the user may request

| User request       | Option to add                                          |
| ------------------ | ------------------------------------------------------ |
| TypedDict only     | `--option "@typespec/http-client-python.models-mode=typeddict"` |
| No tests           | `--option "@typespec/http-client-python.generate-test=false"`   |
| No samples         | `--option "@typespec/http-client-python.generate-sample=false"` |
