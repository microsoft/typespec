---
name: test-unbranded-emitter
description: >
  Build and test the @typespec/http-client-python emitter. Use this skill whenever
  the user wants to test their local changes to the emitter, run the generator
  test suite, check if their http-client-python changes are passing, or validate
  a fix. Triggers on phrases like "test the emitter", "run tests", "check if my
  changes pass", "run test:generator", "run CI", or any mention of testing/validating
  changes in the emitter package.
---

# Test Emitter Skill

Builds and tests `@typespec/http-client-python` to validate local changes.
Automatically regenerates if the generated code is stale.

## Paths

All paths are relative to the http-client-python package root:
`~/Desktop/github/typespec/packages/http-client-python`

| Item                  | Path                                                    |
| --------------------- | ------------------------------------------------------- |
| Package root          | `~/Desktop/github/typespec/packages/http-client-python` |
| Emitter source        | `emitter/src`                                           |
| Generated (unbranded) | `generator/test/unbranded/generated`                    |
| Generated (azure)     | `generator/test/azure/generated`                        |
| Regenerate marker     | `.last-regenerate`                                      |

## Workflow

### Step 1: Build the emitter

```bash
cd ~/Desktop/github/typespec/packages/http-client-python
npm run build
```

Check for TypeScript compilation errors. If the build fails, report the errors
to the user and stop — do not proceed to testing.

### Step 2: Check if regeneration is needed

Regeneration is needed if ANY of these conditions are true:

1. **Generated folder doesn't exist or is empty**:

   ```bash
   cd ~/Desktop/github/typespec/packages/http-client-python
   
   if [ ! -d "generator/test/unbranded/generated" ] \
     || [ -z "$(ls -A generator/test/unbranded/generated 2> /dev/null)" ]; then
     echo "Unbranded generated folder is empty - regeneration needed"
   fi
   
   if [ ! -d "generator/test/azure/generated" ] \
     || [ -z "$(ls -A generator/test/azure/generated 2> /dev/null)" ]; then
     echo "Azure generated folder is empty - regeneration needed"
   fi
   ```

2. **No regenerate marker file exists**:

   ```bash
   if [ ! -f ".last-regenerate" ]; then
     echo "No regenerate marker - regeneration needed"
   fi
   ```

3. **Emitter source files are newer than the marker**:
   ```bash
   if [ -n "$(find emitter/src -newer .last-regenerate -type f 2> /dev/null | head -1)" ]; then
     echo "Emitter source changed since last regenerate - regeneration needed"
   fi
   ```

### Step 3: Regenerate if needed

If any condition from Step 2 is true:

```bash
cd ~/Desktop/github/typespec/packages/http-client-python
echo "Regenerating test clients..."
npm run regenerate
```

After successful regeneration, update the marker:

```bash
touch .last-regenerate
```

If regeneration fails, report the error and stop.

If regeneration is NOT needed, inform the user:

> "Generated code is up to date (source unchanged since last regeneration). Skipping regenerate."

### Step 4: Run the generator test suite

```bash
cd ~/Desktop/github/typespec/packages/http-client-python
npm run ci
```

This runs:

1. `test:emitter` - vitest unit tests for the emitter
2. `ci:generator` - pytest tests against generated code

The full CI can take several minutes. Keep the user informed that it's running.

### Step 5: Report results

- **If tests pass**: Confirm success and summarize any notable output (warnings, skipped tests, etc.)
- **If tests fail**: Show the failing test names and error messages clearly.
  Offer to help debug or investigate specific failures.

## Integration with diff-upstream

Both skills share the regeneration marker system:

- `diff-upstream` always regenerates and updates `.last-regenerate`
- `test-unbranded-emitter` checks this marker and skips regeneration if fresh

**Efficient workflow**:

```
diff-upstream → test-unbranded-emitter
```

The second command will skip regeneration since `diff-upstream` just did it.

**Standalone workflow**:

```
test-unbranded-emitter
```

Will regenerate only if source changed since last run.

## Notes

### Regeneration takes time

`npm run regenerate` can take 2-3 minutes. The staleness check avoids this delay
when the user is iterating on test fixes (not emitter changes).

### Test types

| Command                  | What it runs              | Duration     |
| ------------------------ | ------------------------- | ------------ |
| `npm run test:emitter`   | vitest unit tests only    | ~5 seconds   |
| `npm run test:generator` | pytest only (no vitest)   | ~2 minutes   |
| `npm run ci`             | vitest + pytest (full CI) | ~2-3 minutes |

This skill runs `npm run ci` (full CI). If the user wants just unit tests or
just pytest, they can ask specifically.

### Known flaky test

The test server teardown sometimes fails with `ProcessLookupError` - this is a
pre-existing infrastructure issue, not a test failure. All actual tests may pass
even if you see this error at the end.

### Force regeneration

If the user suspects stale generated code despite the marker, they can force
regeneration:

```bash
rm ~/Desktop/github/typespec/packages/http-client-python/.last-regenerate
```

Then run the skill again.

## Gitignore

Ensure this entry is in the package's `.gitignore`:

```
.last-regenerate
```
