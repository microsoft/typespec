# Testserver Generation

> ⚠️ **WARNING:** This task ONLY involves modifying files in the `packages/http-specs/specs` directory or `cspell.yaml`. DO NOT modify any other packages or files.

> 🚫 **DO NOT** start by searching for related terms across the entire repository. Begin your work ONLY in the `packages/http-specs/specs` directory.

## REQUIRED STEPS (ALL MUST BE COMPLETED IN ORDER)

1. **PREPARATION & RESEARCH**

   - First, run `pnpm install && pnpm build` to fully set up the repository (both commands must complete successfully)
   - Study existing test files:
     - Examine the `main.tsp` and `client.tsp` files in the [specs repository](https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs)
     - Review the `mockapi.ts` files in the [specs repository](https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs)
     - Read descriptions of existing tests and mockapis in the [spec summary](https://github.com/microsoft/typespec/blob/main/packages/http-specs/spec-summary.md)

   > **IMPORTANT:** When researching or implementing a feature, ONLY look at examples within the `packages/http-specs/specs` directory. DO NOT search for or use code from other packages like `http-client-js`, `http`, etc. as references for implementation.

2. **IMPLEMENTATION REQUIREMENTS**

   - **IMPORTANT:** ONLY modify code in these specific locations:
     - `cspell.yaml` file OR
     - `packages/http-specs/specs` folder
   - DO NOT modify any files in other packages (such as `http-client-js`, `http`, etc.)
   - When searching for examples or patterns:
     - RESTRICT your search to the `packages/http-specs/specs` directory only
     - If using `grep_search`, ALWAYS include `packages/http-specs/specs` in the `includePattern`
     - NEVER use examples from other packages as implementation references
   - For each scenario:
     - Add a `@scenario` and `@scenarioDoc` decorator
     - Make the `@scenarioDoc` explicit about input values and expected output
     - Add a corresponding mockapi implementation in `mockapi.ts`
   - Use existing spec files when possible, create new files/folders only when needed
   - Structure namespaces and interfaces carefully - this path becomes the dashboard scenario name
   - Make scenario names clear, descriptive, and concise
   - Keep route names consistent with scenario names
   - Choose appropriate operation grouping (single vs. collection)
   - Group operations into interfaces when it makes sense (e.g., by `path`, `query`, etc.)

3. **VALIDATION & QUALITY CHECKS** (MUST PERFORM ALL OF THESE CHECKS IN THIS EXACT ORDER)

   - After implementation, run these commands from `packages/http-specs` in this exact sequence:

     ```bash
     pnpm build              # Verify build and scenarios pass
     pnpm validate-mock-apis # Verify mockapi implementations
     pnpm cspell             # Check spelling
     pnpm format             # Clean up formatting
     pnpm lint               # Fix linting issues
     pnpm regen-docs         # Regenerate docs (NEVER manually edit spec-summary.md)
     ```

   - If ANY command fails:
     1. Fix the reported errors
     2. Re-run ALL validation commands from the beginning in the exact order shown above
     3. Repeat until ALL commands pass successfully
   - For spelling issues:
     - If the word is valid: add to `cspell.yaml`
     - If invalid but needed: use cspell disables
     - If invalid and not needed: change the word

4. **FINALIZATION**
   - Run `pnpm change add` from the root directory
   - Select the touched package as a "new feature"
   - Only add the `lib:http-specs` label to the PR
   - NEVER remove or modify existing scenario docs

## IMPORTANT REMINDERS

- ⚠️ You MUST run `pnpm regen-docs` after any changes
- ⚠️ You MUST verify all scenarios have mockapi implementations
- ⚠️ You MUST run ALL validation commands listed above IN THE EXACT ORDER specified
- ⚠️ You MUST fix any errors before completing the task
- ⚠️ If ANY validation check fails, fix the issues and re-run ALL checks again from the beginning
