---
name: diff-upstream
description: >
  Regenerate the local emitter and diff the generated code against the upstream
  baseline checked into autorest.python. Use this skill when the user wants to
  see how their emitter changes affect generated code compared to what's currently
  in production, says things like "diff upstream", "compare to baseline", "what
  changed vs production", "show me the diff", "how does this affect generated code",
  or wants to validate their changes produce the expected output differences.
---

# Diff Upstream Skill

Regenerates local emitter output and compares it against the baseline generated
code checked into the autorest.python repository. Shows exactly what would change
if the current emitter changes were shipped.

Optimized for local development with cached baseline and editor integration.

## Paths

All paths are relative to the http-client-python package root.

| Item | Path |
|------|------|
| Package root | `~/Desktop/github/typespec/packages/http-client-python` |
| Local generated (unbranded) | `generator/test/unbranded/generated` |
| Local generated (azure) | `generator/test/azure/generated` |
| Baseline cache (unbranded) | `generator/test/unbranded/.baseline` (gitignored) |
| Baseline cache (azure) | `generator/test/azure/.baseline` (gitignored) |
| Diff summary output | `generator/test/.diff-summary.md` (gitignored) |
| Regenerate marker | `.last-regenerate` |
| Upstream repo | `https://github.com/Azure/autorest.python` |

## Workflow

### Step 1: Build and regenerate

Always regenerate to see current changes:

```bash
cd ~/Desktop/github/typespec/packages/http-client-python
npm run build
npm run regenerate
touch .last-regenerate
```

If build or regenerate fails, report errors and stop.

### Step 2: Fetch or update baseline

Fetch baseline files directly into the test folders using sparse checkout:

```bash
cd ~/Desktop/github/typespec/packages/http-client-python

BASELINE_UNBRANDED="generator/test/unbranded/.baseline"
BASELINE_AZURE="generator/test/azure/.baseline"
TEMP_CLONE="/tmp/autorest-python-baseline-$$"

# Check if we need to fetch/update
if [ ! -d "$BASELINE_UNBRANDED" ] || [ ! -d "$BASELINE_AZURE" ]; then
  echo "Fetching upstream baseline..."

  # Clone with sparse checkout to temp location
  git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/Azure/autorest.python.git "$TEMP_CLONE"

  cd "$TEMP_CLONE"
  git sparse-checkout set \
    packages/typespec-python/test/unbranded/generated \
    packages/typespec-python/test/azure/generated

  cd ~/Desktop/github/typespec/packages/http-client-python

  # Copy to baseline locations
  rm -rf "$BASELINE_UNBRANDED" "$BASELINE_AZURE"
  cp -r "$TEMP_CLONE/packages/typespec-python/test/unbranded/generated" "$BASELINE_UNBRANDED"
  cp -r "$TEMP_CLONE/packages/typespec-python/test/azure/generated" "$BASELINE_AZURE"

  # Cleanup temp clone
  rm -rf "$TEMP_CLONE"

  echo "Baseline cached in generator/test/*/.baseline/"
else
  echo "Using cached baseline (delete generator/test/*/.baseline to refresh)"
fi
```

### Step 3: Generate diff summary

Create a markdown summary file with package-level comparison:

```bash
cd ~/Desktop/github/typespec/packages/http-client-python

LOCAL_UNBRANDED="generator/test/unbranded/generated"
LOCAL_AZURE="generator/test/azure/generated"
BASELINE_UNBRANDED="generator/test/unbranded/.baseline"
BASELINE_AZURE="generator/test/azure/.baseline"

cat > generator/test/.diff-summary.md << EOF
# Diff Summary: Local vs Upstream (autorest.python)

Generated: $(date)

## Unbranded Packages

| Metric | Count |
|--------|-------|
| Local | $(ls "$LOCAL_UNBRANDED" 2>/dev/null | wc -l | tr -d ' ') |
| Upstream | $(ls "$BASELINE_UNBRANDED" 2>/dev/null | wc -l | tr -d ' ') |

### Missing locally (in upstream only):
$(comm -13 <(ls "$LOCAL_UNBRANDED" 2>/dev/null | sort) <(ls "$BASELINE_UNBRANDED" 2>/dev/null | sort) | sed 's/^/- /' || echo "- (none)")

### New locally (not in upstream):
$(comm -23 <(ls "$LOCAL_UNBRANDED" 2>/dev/null | sort) <(ls "$BASELINE_UNBRANDED" 2>/dev/null | sort) | sed 's/^/- /' || echo "- (none)")

## Azure Packages

| Metric | Count |
|--------|-------|
| Local | $(ls "$LOCAL_AZURE" 2>/dev/null | wc -l | tr -d ' ') |
| Upstream | $(ls "$BASELINE_AZURE" 2>/dev/null | wc -l | tr -d ' ') |

### Missing locally (in upstream only):
$(comm -13 <(ls "$LOCAL_AZURE" 2>/dev/null | sort) <(ls "$BASELINE_AZURE" 2>/dev/null | sort) | sed 's/^/- /' || echo "- (none)")

### New locally (not in upstream):
$(comm -23 <(ls "$LOCAL_AZURE" 2>/dev/null | sort) <(ls "$BASELINE_AZURE" 2>/dev/null | sort) | sed 's/^/- /' || echo "- (none)")

---

## Viewing Detailed Diffs

### List changed files in a package:
\`\`\`bash
diff -rq generator/test/unbranded/generated/PACKAGE generator/test/unbranded/.baseline/PACKAGE
\`\`\`

### View full diff for a package:
\`\`\`bash
diff -r generator/test/unbranded/generated/PACKAGE generator/test/unbranded/.baseline/PACKAGE
\`\`\`

### Open side-by-side diff in VS Code:
\`\`\`bash
code --diff generator/test/unbranded/.baseline/PACKAGE/path/to/file.py generator/test/unbranded/generated/PACKAGE/path/to/file.py
\`\`\`

EOF
```

### Step 4: Open in editor

Open the summary file in the user's preferred editor:

```bash
cd ~/Desktop/github/typespec/packages/http-client-python

# Try common editors in order of preference
if command -v code &> /dev/null; then
  code generator/test/.diff-summary.md
elif [ -n "$VISUAL" ]; then
  $VISUAL generator/test/.diff-summary.md
elif [ -n "$EDITOR" ]; then
  $EDITOR generator/test/.diff-summary.md
elif command -v vim &> /dev/null; then
  vim generator/test/.diff-summary.md
else
  cat generator/test/.diff-summary.md
fi
```

### Step 5: Report to user

Tell the user:
- Summary file is open at `generator/test/.diff-summary.md`
- Baseline is cached alongside generated code in `generator/test/*/.baseline/`
- How to view detailed diffs (commands are in the summary file)
- How to refresh baseline: `rm -rf generator/test/*/.baseline`

## Viewing Detailed File Diffs

After showing the summary, if the user wants to see specific file changes:

### Find changed files in a package:
```bash
cd ~/Desktop/github/typespec/packages/http-client-python
diff -rq \
  generator/test/unbranded/generated/typetest-array \
  generator/test/unbranded/.baseline/typetest-array
```

### Show inline diff for a file:
```bash
diff -u \
  generator/test/unbranded/.baseline/typetest-array/typetest/array/_client.py \
  generator/test/unbranded/generated/typetest-array/typetest/array/_client.py
```

### VS Code side-by-side (if user has VS Code):
```bash
code --diff \
  generator/test/unbranded/.baseline/typetest-array/typetest/array/_client.py \
  generator/test/unbranded/generated/typetest-array/typetest/array/_client.py
```

## Integration with test-unbranded-emitter

After running `diff-upstream`, you can immediately run tests:
- The `.last-regenerate` marker is updated
- `test-unbranded-emitter` will skip regeneration since it's fresh

## Cleanup

The baseline is cached for fast subsequent runs. To refresh:

```bash
# Remove baseline (will re-fetch on next run)
rm -rf generator/test/unbranded/.baseline generator/test/azure/.baseline

# Remove summary file
rm generator/test/.diff-summary.md
```

## Gitignore

These patterns should be in `.gitignore`:
```
generator/test/unbranded/.baseline/
generator/test/azure/.baseline/
generator/test/.diff-summary.md
.last-regenerate
```

## Interpreting Diffs

After generating the diff, analyze what changed and report to the user whether the diffs are expected.

### Step 1: Check what code changes were made on the branch

First, understand what emitter changes were made:

```bash
# Show commits on this branch
git log main..HEAD --oneline -- "emitter/src/*.ts"

# Show the actual changes
git diff main..HEAD -- emitter/src/
```

### Step 2: Correlate code changes with expected generated output changes

Based on the emitter changes, determine what generated code SHOULD change:

| Emitter change type | Expected generated code impact |
|---------------------|-------------------------------|
| Namespace logic refactor (behavior-preserving) | No generated code changes |
| New decorator support | Changes in files using that decorator |
| Serialization changes | Changes in `_serialization.py`, model files |
| Client initialization changes | Changes in `_client.py`, `_configuration.py` |
| Operation changes | Changes in `_operations/*.py` |

### Step 3: Compare expected vs actual diffs

- **If actual diffs match expected:** Tell user "The diffs are expected based on your emitter changes to [describe changes]. The generated code correctly reflects your modifications."

- **If no diffs but expected some:** Tell user "No generated code changes detected. If you expected changes, verify your emitter modifications are being triggered by the test specs, or there may be more development needed. Should I investigate further?"

- **If unexpected diffs appear:** Tell user "Found unexpected changes in [files]. These don't appear to match your emitter modifications. There may be unintended side effects - would you like me to investigate?"

### Pre-existing repo differences (always present, not caused by your changes)

These diffs exist between typespec and autorest.python repos regardless of emitter changes. They should be ignored when evaluating your changes:

| File type | Typical diff | Cause |
|-----------|--------------|-------|
| `_patch.py` | `List[str]` → `list[str]` | Type hint modernization (Python 3.9+ style) |
| `CHANGELOG.md` | Formatting differences | Template differences |
| `README.md` | Service display names | Template/config differences |
| `pyproject.toml` / `setup.py` | Different packaging | Tooling preferences |

**If only these files differ:** "The only diffs are pre-existing repo differences (type hints, config files), not caused by your emitter changes. Your changes are behavior-preserving."

### Unexpected diffs (actual code changes)

If you see differences in these files, the emitter changes ARE affecting generated code:

- `_client.py` - Client class definitions
- `_operations/*.py` - Operation implementations
- `models/*.py` - Model definitions (excluding `_patch.py`)
- `_serialization.py` - Serialization logic
- `aio/*.py` - Async client code

**If these files differ:** First check if the changes match what the emitter modifications should produce. If they match, say "The generated code changes are expected based on your emitter changes." If they don't match or are unexpected, say "Found changes that don't appear to match your emitter modifications. There may be more development needed - would you like me to investigate?"

### Quick diff analysis command

To check if there are actual code changes (excluding expected differences):

```bash
diff -rq generator/test/unbranded/generated generator/test/unbranded/.baseline 2>/dev/null | grep "\.py differ" | grep -v "_patch.py"
```

If this returns nothing, only expected diffs exist.

## Notes

### Diff direction

The diff shows changes from upstream (baseline) to local (your changes):
- `-` lines: removed from upstream (or changed)
- `+` lines: added in your local version

### Why packages might be missing locally

Some upstream packages may not generate locally due to:
- TypeSpec version incompatibilities in the monorepo
- Specs that require specific dependencies not installed
- Test configurations that differ between repos

This is expected for ARM/azure-resource-manager specs if there are version conflicts.

### Performance

- First run: ~30-60s (fetch baseline)
- Subsequent runs: instant (uses cached baseline)
- Regenerate: ~2-3 minutes (always runs for diff)
