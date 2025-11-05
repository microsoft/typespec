# TCGC Migration Instructions for Copilot

## Purpose

These instructions help Copilot automatically upgrade TypeSpec emitters to a new version of @azure-tools/typespec-client-generator-core with minimal user intervention.

## Trigger

When a user says: **"tcgc upgrade \<emitter-name\> \<version\>"**

Example: `tcgc upgrade my-emitter 0.61.0`

## Migration TODO List

**IMPORTANT: Use the `manage_todo_list` tool throughout this migration to track progress and ensure no steps are missed.**

When starting the migration, create a TODO list with these items:

1. **Pre-migration assessment** - Detect build system and run initial build
2. **Package upgrade** - Update package.json and install dependencies
3. **Post-upgrade build** - Run build to identify breaking changes
4. **Fix breaking changes** - Apply code changes to resolve issues
5. **Final validation** - Run build to ensure all issues resolved
6. **Summary and documentation** - Report changes to user

Mark each todo as `in-progress` when starting work on it, and `completed` when finished. This helps track migration progress and ensures systematic completion.

## Step-by-Step Migration Process

### IMPORTANT GUARDRAILS:
- ONLY use `npm` commands don't try to use `pnpm`, `yarn`, or any other package manager.
- Although emitter packages are within a pnpm monorepo, they are NOT part of the workspace. Always run `npm install` within the emitter package directory.

### Phase 1: Pre-Migration Assessment

**Use `manage_todo_list` to mark "Pre-migration assessment" as in-progress**

1. **Identify the target package** to upgrade in `package.json` dependencies or devDependencies.
   - The prompt provides the emitter name and target version.
   - Locate the target package under packages
      - First try to find it in packages/<emitter-name>, if emitter-name includes npm scope (e.g. @azure/my-emitter), look for packages/my-emitter
      - If not found, search all packages for the emitter name in package.json

2. **Determine build command** by checking `package.json` scripts in this order:
   1. `build`
   2. `compile`
   3. `tsc`

3. **Install Dependencies** using the detected package manager:

   ```bash
    npm install
  ```

4. **Run initial build** to establish baseline:

   ```bash
   # Use the appropriate command
   npm run build
   ```
   - If build fails, note the errors but continue (existing issues)
   - If build succeeds, proceed to upgrade

**Mark "Pre-migration assessment" as completed and "Package upgrade" as in-progress**

### Phase 2: Package Upgrade

#### Important Guardrails:

- **Never** run `npm install --legacy-peer-deps`, `--force`, or `--omit-peer`.
- **Never** delete or relax existing **upper** peer bounds. If a peer says `<1.0.0`, you keep `<1.0.0`.
- Goal = after edits, plain:`npm install` **succeeds**.
- Success also = the target package is at the version the user said.

Copilot may:
1. **Read/parse/write**: `package.json`, `package-lock.json` (if present).
2. **Run shell commands** in the emitter folder:

   * `npm view <pkg>@<version> peerDependencies --json`
   * `npm view <pkg>@<version> dependencies --json` (sometimes useful)
   * `npm view <pkg>@<version> version` (verify version exists)
   * `npm view <pkg>@"<range>" version` (find versions matching a range)
   * `npm view <pkg> versions --json` (list all available versions)
   * `npm ls --all --json`

3. **Parse npm ERESOLVE output** and extract:

   * the **required** peer
   * who is **requesting** it
   * what **range** is incompatible
   * which **specific version** is causing the conflict
4. **Edit JSON in-place** and re-run.
5. **Version verification**: Always verify versions exist before setting them, especially for dev versions which may not be released for all packages in a family.
6. **Handle mixed version strategies**: When constraint satisfaction requires using different specific versions across a package family (e.g., compiler@0.67.2 but http@0.67.1).

If the agent can't run shell, it must **simulate** it by asking the user for the results — but in your case, we want it to run commands.

#### The command interface

**User says:**

```text
tcgc upgrade my-emitter 0.54.0-dev.19
```

**Agent interprets:**

```json
{
  "task": "upgrade-package",
  "target": {
    "name": "my-emitter",
    "upgradeDependency": "@azure-tools/typespec-client-generator-core",
    "upgradeToVersion": "0.54.0-dev.19"
  }
}
```

#### Upgrade steps:
1. **Load current state**

   * Read `package.json` → keep original copy.
   * If exists, read `package-lock.json`.

2. **Apply the user's wish**

   * Set **the exact target package** (`devDependencies` if there, else `dependencies`) to the requested version.
   * **CRITICAL**: Use exact versions for dev packages, not tilde ranges. A range like `~0.54.0-dev.5` can resolve to the stable `0.54.0` release, which may have incompatible peer dependencies.
   * Example: user says `upgrade @azure-tools/typespec-client-generator-core 0.54.0-dev.19`

     * In this repo it lives in `devDependencies`, so:

       ```json
       "devDependencies": {
         "@azure-tools/typespec-client-generator-core": "0.54.0-dev.19",
         ...
       }
       ```
3. **Interrogate the target**

   * Run:

     ```bash
     npm view @azure-tools/typespec-client-generator-core@0.54.0-dev.19 peerDependencies --json
     ```
   * Call that result **TARGET_PEERS**.
   * This is usually something like (example from your earlier trials):

     ```json
     {
       "@typespec/sse": "^0.67.1 || >=0.68.0-dev <0.68.0",
       "@typespec/xml": "^0.67.1 || >=0.68.0-dev <0.68.0",
       "@typespec/http": "^0.67.1 || >=0.68.0-dev <0.68.0",
       "@typespec/rest": "^0.67.1 || >=0.68.0-dev <0.68.0",
       "@typespec/openapi": "^0.67.1 || >=0.68.0-dev <0.68.0",
       ...
     }
     ```

4. **Build the “TypeSpec universe” for this package**

   * From your `package.json` we know this package is in a “bundle” with these families:

     * `@azure-tools/*`
     * `@typespec/*`
   * The agent should make a working set called `TSP_SET` containing **all** packages in your `peerDependencies` and `devDependencies` whose names start with **either** of those prefixes.
   * In your case that’s things like:

     * `@azure-tools/typespec-autorest`
     * `@azure-tools/typespec-azure-core`
     * `@azure-tools/typespec-azure-resource-manager`
     * `@azure-tools/typespec-azure-rulesets`
     * `@azure-tools/typespec-client-generator-core` (target)
     * `@typespec/compiler`
     * `@typespec/http`
     * `@typespec/openapi`
     * `@typespec/rest`
     * `@typespec/versioning`
     * `@typespec/http-specs`
     * (possibly more if present)

5. **For every package in TARGET_PEERS → check compatibility with our own declared peers**

   * For each `(peerName → peerRangeRequired)` in **TARGET_PEERS**:

     1. If our `package.json` has `peerDependencies[peerName]`:

        * **Do NOT change the upper bound**.
        * If the required lower bound is **higher** than our current lower bound, bump **only the lower bound** to match, preserving the right side.
        * Example:

          * Current: `"@typespec/http": ">=0.67.0 <1.0.0"`
          * Required: `>=0.68.0-dev <0.68.0`
          * We **can** rewrite ours to:

            ```text
            ">=0.68.0-dev <1.0.0"
            ```

            i.e. **left side comes from the stricter requirement**, right side stays ours.
        * If the required range is actually **a disjunction** (like `^0.67.1 || >=0.68.0-dev <0.68.0`), then:

          * **First check which versions actually exist** using `npm view <pkg>@"<range>" version`
          * pick the **highest available lower-bound option** that is **still below our upper bound**,
          * normalize to our style.
          * Example:

            * Our upper: `<1.0.0`
            * Options: `^0.67.1` or `>=0.68.0-dev <0.68.0`
            * Check: `npm view @typespec/http@"^0.67.1" version` → might return 0.67.1
            * Check: `npm view @typespec/http@">=0.68.0-dev <0.68.0" version` → might return 0.68.0-dev.9
            * Pick the highest available version that satisfies constraints
            * Final: `>=0.67.1 <1.0.0` or `>=0.68.0-dev.9 <1.0.0`
     2. Else if our `package.json` has it only in **devDependencies**:

        * Then we must bump **that** devDependency to at least the required version.
        * And (important) check if we also have it in **peerDependencies** — if not, and this is a “core TypeSpec runtime” like `@typespec/http` or `@typespec/compiler`, we **should also declare it as a peer** with our usual guard:

          ```json
          "@typespec/http": ">=0.68.0-dev <1.0.0"
          ```

          (still keep `<1.0.0`)
     3. Else (we don't declare it at all):

        * Add it to **devDependencies** at the **exact** version the target is asking for (or the min version in its range),
        * **Verify the version exists** using `npm view <pkg>@<version> version`
        * and if it's one of the foundational packages (`@typespec/*`), also add as peer with guard.

   * **Important**: Not all packages in the TypeSpec family release the same version numbers. For example, `@typespec/compiler` might have version `0.67.2` while `@typespec/http` only goes up to `0.67.1`. Always verify version existence before setting dependencies.


6. **Synchronize the “other Azure TypeSpec packages”**
   * Note: “a package that is not a peer directly to TCGC could need updating”.
   * After updating peers for the target, the agent must **query** the versions of the other Azure packages you already depend on at **the same level**.
   * For each package in your current `devDependencies` that starts with `@azure-tools/typespec-`:

     * Run:

       ```bash
       npm view <that-package>@"*"
       npm view <that-package>@latest peerDependencies --json
       ```

       or better

       ```bash
       npm view <that-package>@<matching-series> peerDependencies --json
       ```

       where `<matching-series>` is **the same major/minor** as the TCGC you just set (often they evolve together).
     * Then do the **same reconciliation** as in step 5: raise lower bounds in our peers/devDeps but **do not** touch upper bounds.

7. **Attempt install (validation step)**

   * **First, clean any existing resolution state**: `rm -rf node_modules package-lock.json` to avoid npm cache conflicts
   * Run:

     ```bash
     npm install --package-lock-only
     ```
   * If it **succeeds** → we’re done.
   * If it **fails with ERESOLVE**:

     * **Parse the error**. npm gives you something like:

       > While resolving: X
       > Found: @typespec/compiler@1.0.0
       > Could not resolve peer … wants @typespec/compiler@"^0.67.0"
     * The agent must **not** “fix” this by adding `--legacy-peer-deps`.
     * Instead it must:

       1. Identify the **requester** (e.g. `@azure-tools/typespec-azure-core@0.53.0`)
       2. Run:

          ```bash
          npm view @azure-tools/typespec-azure-core@0.53.0 peerDependencies --json
          ```
       3. See which of your local peers is **too old** → bump that peer’s **lower** bound (keep the upper)
       4. Possibly bump the **devDependency** to the exact version the requesting package wants
       5. **Re-run** `npm install --package-lock-only`
     * This becomes a **loop**:

       ```text
       edit → npm install → ERESOLVE → look at who is unhappy → bump that package → npm install → ...
       ```
     * Stop when install succeeds.

8. **Write final state**

   * Save the modified `package.json`.
   * Save the updated `package-lock.json`.

9. **Validate** by running:

   ```bash
   npm install
   ```
    - This should now succeed without errors
10. **Report**

   * Agent outputs:

     * target package and final version
     * list of packages whose **peer lower bound** it raised
     * list of packages whose **devDependency** it bumped
     * final npm command that passed

**Mark "Package upgrade" as completed and start marking specific fix categories as in-progress**

#### Critical Lessons Learned from Actual Upgrades
Based on real upgrade experiences, these are the most critical issues to handle:

### **Version Existence Verification Strategy**
- **Always verify versions exist** before setting them: `npm view <pkg>@<version> version`
- TypeSpec packages don't release in lockstep. `@typespec/compiler` might have `0.67.2` while `@typespec/http` only has `0.67.1`
- Dev versions are particularly inconsistent across packages
- **Create a version availability map** early in the process:
  ```bash
  # Check available dev versions for each package
  npm view @typespec/compiler versions --json | grep "0.68.0-dev" | tail -5
  npm view @typespec/http versions --json | grep "0.68.0-dev" | tail -5
  npm view @typespec/rest versions --json | grep "0.68.0-dev" | tail -5
  ```

### **Smart Version Selection Algorithm**
When disjunctive constraints like `^0.67.1 || >=0.68.0-dev <0.68.0` are encountered:

1. **Parse constraint components**: Split on `||` to get individual options
2. **Test each option for version availability**:
   ```bash
   npm view @typespec/http@"^0.67.1" version --json
   npm view @typespec/http@">=0.68.0-dev <0.68.0" version --json
   ```
3. **Select based on ecosystem compatibility**:
   - If TCGC expects 0.68.0-dev series → prefer 0.68.0-dev option if available
   - If TCGC was built against 0.67.x → prefer 0.67.x option for stability
   - **Check TCGC's own peer dependencies** to understand its expected TypeSpec version

4. **Constraint boundary awareness**: 
   - `<0.68.0` excludes `0.68.0-dev.9` and higher dev versions
   - Use highest compatible version within bounds: `0.68.0-dev.8` instead of `0.68.0-dev.9`

### **TypeSpec Version Series Detection**
Determine the TypeSpec version series that TCGC was designed for:

1. **Check TCGC's published peer dependencies**:
   ```bash
   npm view @azure-tools/typespec-client-generator-core@0.54.0-dev.19 peerDependencies --json
   ```
2. **Identify if it's 0.67.x or 0.68.0-dev based**:
   - If peers show `^0.67.1 || >=0.68.0-dev <0.68.0` → could work with either
   - If peers show only `^0.67.1` → stick to 0.67.x series
   - If peers show only `>=0.68.0-dev` → requires 0.68.0-dev series

3. **Version series recommendations**:
   - **For TCGC 0.54.0-dev.19**: Use mixed strategy (0.67.x where available, 0.68.0-dev where needed)
   - **For TCGC 0.55.0+**: Likely requires full 0.68.0-dev or 1.0.0+ series

### **Azure Package Family Synchronization**
- When upgrading TCGC to `0.54.0-dev.19`, other Azure packages likely need similar upgrades
- **Find compatible versions in the same dev series**:
  ```bash
  npm view @azure-tools/typespec-autorest versions --json | grep "0.54.0-dev"
  npm view @azure-tools/typespec-azure-core versions --json | grep "0.54.0-dev"
  ```
- **Verify cross-compatibility**:
  ```bash
  npm view @azure-tools/typespec-autorest@0.54.0-dev.5 peerDependencies --json
  ```
- **Update strategy**: Update **both** devDependencies and peerDependencies for Azure packages

### **Advanced ERESOLVE Resolution Patterns**
Based on common error patterns encountered:

1. **TCGC version mismatch pattern**:
   ```
   Could not resolve peer @azure-tools/typespec-client-generator-core@"^0.53.0" 
   from @azure-tools/typespec-autorest@0.53.0
   ```
   **Solution**: Upgrade autorest to 0.54.0-dev.X that accepts the new TCGC version
   **Command**: `npm view @azure-tools/typespec-autorest versions --json | grep "0.54.0-dev"`

2. **TypeSpec version boundary conflicts**:
   ```
   Found: @typespec/compiler@0.68.0-dev.9 
   wants @typespec/compiler@"^0.67.2 || >=0.68.0-dev <0.68.0"
   ```
   **Analysis**: Constraint `<0.68.0` excludes `0.68.0-dev.9`
   **Solution**: Use `0.68.0-dev.8` or lower, or use the `^0.67.2` option if available

3. **Mixed ecosystem requirements**:
   ```
   Found: @typespec/http@0.67.1
   wants @typespec/http@">=0.68.0-dev <0.68.0"
   ```
   **Solution**: Check if 0.68.0-dev versions exist and are compatible with other constraints

4. **Iterative resolution strategy**:
   - Each ERESOLVE error reveals another package needing updates
   - Create a dependency graph mentally: TCGC → Azure packages → TypeSpec packages
   - Work from target outward: Fix TCGC conflicts first, then Azure package conflicts, then TypeSpec conflicts

### **Environment State Management & Validation**
Critical for reliable dependency resolution:

1. **Clean slate approach**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --package-lock-only  # Test resolution without scripts
   ```
   - npm caches resolution decisions that can hide real conflicts
   - Always validate from clean state before declaring success

2. **Progressive validation steps**:
   ```bash
   npm install --package-lock-only     # Test pure resolution
   npm install --ignore-scripts       # Test without post-install hooks
   npm install                         # Full installation
   npm run build                       # Final functionality test
   ```

3. **Version verification commands**:
  Before running these, you need to run `npm install` successfully. `npm install --package-lock-only` is not enough to populate the `node_modules` tree for `npm ls` to work correctly.
   ```bash
   npm ls @azure-tools/typespec-client-generator-core  # Verify target version
   npm ls @typespec/http                               # Check TypeSpec version
   npm ls --depth=0 | grep "@typespec\|@azure-tools"  # Overview of ecosystem
   ```

### **Transitive Dependency Management & Bridge Versions**
When packages have conflicting peer dependency requirements:

1. **Identify bridge versions**: Look for versions that support multiple ranges
   ```bash
   # Example: Find azure-http-specs versions that bridge 0.53.x and 0.54.0-dev
   npm view @azure-tools/azure-http-specs versions --json | grep -E "(alpha|dev)"
   npm view @azure-tools/azure-http-specs@0.1.0-alpha.12-dev.1 peerDependencies --json
   ```

2. **Look for disjunctive constraints**: Prefer versions with `^0.53.0 || >=0.54.0-dev <0.54.0` patterns

3. **Transitive dependency discovery**:
   - Check **all** packages in devDependencies for peer dependencies: `npm view <pkg>@<version> peerDependencies --json`
   - Example: `@azure-tools/azure-http-specs` can have peers on `@azure-tools/typespec-azure-core`
   - Find versions that work with both old and new ecosystems

### **Version Range Pitfalls & Solutions**
Critical patterns discovered during migration:

1. **Tilde ranges on dev versions are dangerous**: 
   - `~0.54.0-dev.5` can resolve to stable `0.54.0` which may expect different TypeSpec versions
   - **Always use exact versions for dev packages**: `0.54.0-dev.5` not `~0.54.0-dev.5`

2. **Constraint boundary precision**:
   - `<0.68.0` excludes `0.68.0-dev.9` but includes `0.68.0-dev.8`
   - Test with: `npm view @typespec/http@">=0.68.0-dev <0.68.0" version` to see actual matches

3. **Mixed ecosystem strategies**:
   - Use `compiler@0.67.2` with `http@0.67.1` when 0.68.0-dev compatibility is incomplete
   - Example working combination for TCGC 0.54.0-dev.19:
     ```json
     "@typespec/compiler": "~0.67.2",
     "@typespec/http": "~0.67.1", 
     "@typespec/rest": "~0.67.1"
     ```

4. **Dev version compatibility matrix**:
   - Check what npm actually resolves: `npm view pkg@"~0.54.0-dev.5" version`
   - Verify stable releases don't leak in with: `npm ls <pkg> --depth=0` after install

### **Environment State Management**
- **Always clean npm state** before final validation: `rm -rf node_modules package-lock.json`
- npm can cache resolution decisions that prevent seeing the real dependency conflicts
- Use `--ignore-scripts` flag during validation to avoid post-install script errors that mask successful resolution

### **Version Range Pitfalls**
1. **Version verification first**: Before setting any dependency, verify it exists with `npm view <pkg>@<version> version`
2. **Family-aware upgrading**: For Azure packages, upgrade all related packages together in the same version series
3. **Constraint parsing**: Handle `<0.68.0` constraints correctly (excludes certain `0.68.0-dev.X` versions)
4. **Iterative ERESOLVE resolution**: Each error reveals another package needing updates - work systematically from target outward
5. **Use version availability discovery commands**:
   ```bash
   # Quick version series check
   npm view <pkg> versions --json | grep -E "0.54.0-dev|0.68.0-dev" | tail -5
   
   # Test constraint matches
   npm view <pkg>@">=0.68.0-dev <0.68.0" version
   
   # Verify exact version exists
   npm view <pkg>@0.68.0-dev.8 version
   ```

### **Recommended Version Selection Workflow**
1. **Start with version discovery**: Map what versions exist across the TypeSpec ecosystem
2. **Check TCGC's expectations**: Understand what TypeSpec series the target TCGC was built for
3. **Pick ecosystem strategy**: Either full 0.67.x, mixed 0.67.x/0.68.0-dev, or full 0.68.0-dev
4. **Apply constraint-aware selection**: Choose highest compatible versions within bounds
5. **Validate iteratively**: Test resolution after each major package upgrade
6. **Clean state validation**: Always verify final state from clean npm environment


### Phase 3: Fix Breaking Changes - Enhanced Strategy

**Mark "Post-upgrade build analysis" as in-progress**

1. **Immediate build analysis after package upgrade**:
   ```bash
   npm run build 2>&1 | tee build-errors.log
   ```
   - Capture ALL error output for systematic analysis
   - TypeScript compilation errors often reveal exactly what broke
   - Parse error patterns to identify fix categories

2. Fetch @azure-tools/typespec-client-generator-core changelog and breaking changes documentation to understand common upgrade issues.
  - Fetch: https://raw.githubusercontent.com/Azure/typespec-azure/refs/heads/main/packages/typespec-client-generator-core/CHANGELOG.md
  - Identify documented breaking changes between old and new versions

3. **Error categorization framework**:
   - **Import/Export changes**: Missing exports, renamed interfaces
   - **Type signature changes**: Method parameter/return type changes  
   - **API structure changes**: Removed properties, changed object hierarchy
   - **Build configuration issues**: Internal library compatibility problems

4. **Systematic error analysis**:
   - For each unique error pattern:
     - Identify the root cause (what changed in TCGC)
     - Determine fix scope (single file vs. multiple files)
     - Create specific TODO items for each fix category
     - Use semantic_search to find all affected files

**Mark "Post-upgrade build analysis" as completed when error categories identified**

### **Build Configuration Resilience**

When internal TCGC dependencies cause TypeScript compilation issues:

1. **Identify internal vs. emitter issues**:
   - Errors in `node_modules/@azure-tools/typespec-client-generator-core/dist/*.d.ts` are internal
   - These indicate TCGC library compatibility issues, not emitter code problems

2. **Strategic workarounds**:
   - **First**: Try updating TypeScript configuration before code changes
   - **Document workarounds**: Always note when workarounds are applied and why

3. **Validation approach**:
   - Apply workarounds incrementally
   - Verify that actual emitter functionality is preserved
   - Prefer targeted fixes over broad compiler flag changes

### **Error-Driven Fix Methodology**

1. **Fix in dependency order**:
   - Start with import/export errors (foundation issues)
   - Then fix type signature mismatches  
   - Finally address API structure changes
   - Handle build configuration last (after verifying real code issues)

2. **Per-error category workflow**:
   ```
   Mark category as in-progress → 
   semantic_search for affected files → 
   Apply multi_replace_string_in_file for batch fixes →
   npm run build to validate fixes →
   Mark category as completed
   ```

3. **Fix validation pattern**:
   - After each category of fixes, run build immediately
   - New errors may appear as previous errors are resolved
   - Update TODO list with newly discovered error categories
   - Continue until clean build achieved

### **Tool Usage Best Practices for Breaking Changes**

1. **Batch operations when possible**:
   - Use `multi_replace_string_in_file` for similar changes across multiple files
   - Use `semantic_search` to find all instances before making changes
   - Group related fixes together rather than making changes one at a time

2. **Build feedback loop**:
   - Always run `npm run build` after completing a fix category
   - Capture error output to identify remaining issues
   - Don't assume fixing one error category won't reveal new errors

3. **Workaround documentation**:
   - When applying build configuration workarounds, document:
     - What the workaround does
     - Why it was necessary
     - Whether it affects emitter functionality
   - This helps users understand temporary vs. permanent changes

**Mark relevant fix categories as completed when done**

### Phase 4: Validation

**Mark "Final validation" as in-progress**

1. **Run final build** after applying all fixes:

   ```bash
   # Use same build command as before
   npm run build                          # for npm
   ```

2. **Verify success:**
   - Build should complete without errors
   - If errors remain, analyze and apply additional fixes
   - Common remaining issues:
     - Missing null checks (`?.` operators)
     - Import statement updates
     - Type annotation updates

**Mark "Final validation" as completed**

### Phase 5: Completion

**Mark "Summary and documentation" as in-progress**

1. **Report results** to user:
   - Summarize changes made
   - List any manual fixes that may be needed
   - Confirm successful upgrade and build

**Mark "Summary and documentation" as completed**

**All todos should now be completed - verify with `manage_todo_list` tool**

## Safety Guidelines

- NEVER Bypass peerdependency checks
- Always run builds before and after changes to establish baseline
- Use optional chaining (`?.`) when accessing nested properties
- Preserve existing functionality - only change what's broken
- If unsure about a fix, apply the most conservative approach
- Focus on compilation errors first, then runtime behavior
- Avoid explicit `any` type assertions; prefer precise typings or implicit inference
- Use `npx` to run commands for example `npx tsc` to ensure local versions are used.

## Success Criteria

✅ Package successfully upgraded to target version  
✅ All dependencies installed without conflicts  
✅ **Build completes without blocking errors** (workarounds documented if used)
✅ **All emitter-level breaking changes resolved** (TCGC API usage updated)
✅ **Core emitter functionality validated** (can generate basic client code)
✅ Existing functionality preserved where API allows
✅ Migration follows official Azure SDK TypeSpec patterns

## Notes for LLMs

- **Use TODO tracking:** Always use the `manage_todo_list` tool to create and track migration progress
- **Be systematic:** Follow the phases in order and mark todos complete as you go
- **Be thorough:** Check all files that import the upgraded package
- **Be conservative:** Only change what's necessary to fix build errors
- **Be consistent:** Apply the same patterns across similar code
- **Validate frequently:** Run builds after each major change to catch issues early
- **Document changes:** Summarize what was changed and why
- **Update progress:** Mark todos as in-progress when starting and completed when finished
- **Do not change unrelated code:** Do not modify code or comments that is unrelated to the migration
- **No any type assertions:** Avoid using `any` type assertions; prefer precise typings or implicit inference.

This migration should be **fully automated** with minimal user intervention beyond the initial command.
 