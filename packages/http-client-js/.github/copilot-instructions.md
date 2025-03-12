> **Scope**: These instructions apply **only** to the `packages/http-client-js` sub-project in this monorepo. Use them whenever Copilot generates code, tests, commit messages, or pull request descriptions for the emitter. If Copilot is used in other sub-projects, these rules do not apply unless stated otherwise.

---

## 1. Code Generation Instructions

- **Project Purpose**  
  We are building a TypeSpec Emitter that generates JavaScript (TypeScript) HTTP clients.

- **Language & Modules**

  - Always generate TypeScript using **ES Modules**.
  - Do **not** use `require` or `__dirname`.
  - Do **not** introduce new dependencies or frameworks without explicit approval.

- **Core Stack**

  1. **TypeSpec Compiler & Libraries**
     - `@typespec/compiler`, `@typespec/http`, `@typespec/emitter-framework`, `@typespec/http-client`
     - Activate typekits by importing:
       ```ts
       import { $ } from "@typespec/compiler/experimental/typekit";
       import "@typespec/http/experimental/typekit";
       ```
  2. **Alloy-JS**
     - `@alloy-js/core` + `@alloy-js/typescript` for templating code with JSX-like syntax.
     - **`@typespec/emitter-framework/typescript`** offers higher-level React-like components (e.g., `<ef.InterfaceDeclaration type={model} />`) for converting TypeSpec types to TypeScript code.
  3. **No React**
     - Alloy-JS syntax **resembles** React but is implemented independently. Don’t import React libraries.

- **Emitter Implementation**

  - Implement `$onEmit` to hook into TypeSpec’s compiler. For example:
    ```ts
    export async function $onEmit(program: Program, emitterOptions: MyEmitterOptions) {
      // Query the type graph using program.checker, typekits, etc.
      // Generate TypeScript code using Alloy-JS.
    }
    ```
  - Parse TypeSpec’s type graph to gather HTTP metadata (e.g., operations, models) and emit TypeScript code using Alloy-JS components.

- **Coding Style**
  - Follow **SOLID** and **KISS** principles.
  - Use TypeScript best practices; keep your code readable and reusable.
  - Write **JSDoc** for public/exported functions or classes.
  - Add inline comments for non-obvious logic or design decisions.
  - Favor clarity over cleverness, particularly for new developer onboarding.

---

## 2. Test Generation Instructions

- **Test Format**

  - Use **literate tests** in Markdown files under `test/scenarios/**/*.md`.
  - Each test file typically has:
    1. `# [TestTitle]`: High-level description of the scenario being tested.
    2. `## Spec`: Contains a TypeSpec snippet as input for the emitter.
    3. `## [Test Expectation]`: Contains code blocks showing the _expected_ generated code.

- **Example**

  ```md
  # [MyTest]

  Tests generating a client for a simple model.

  ## Spec

  \`\`\`tsp
  namespace Test;
  model Foo { name: string; }
  @get op getFoo(): Foo;
  \`\`\`

  ## [Test Expectation]

  \`\`\`ts path/to/generated.ts function jsonFooToTransportTransform
  export function jsonFooToTransportTransform(input: Foo) {
  // This is the expected code snippet
  }
  \`\`\`
  ```

- **Implementation**

  - Use the `@typespec/emitter-framework` test harness to process these `.md` files and validate generated outputs.
  - Do **not** add extra test libraries (e.g., Jest, Mocha). The built-in harness is sufficient.

- There should only be a single tsp code block per h1 (#) heading.
  - H1 Headings translate to describe blocks in vitest
  - ts codeblocks translate to it blocks in vitest.
  - !NEVER modify existing ts or tsp code blocks

---

## 3. Code Review Instructions

- **Review Criteria**

  - Confirm ES Module usage (no `require`).
  - Check that code remains **SOLID** and not over-engineered.
  - Ensure public functions are documented with JSDoc.
  - Verify usage of the correct TypeSpec or Alloy-JS APIs (e.g., `$onEmit`, `<ef.InterfaceDeclaration>`, etc.).
  - If logic is complex, suggest more inline comments or a concise doc block.

- **No Unauthorized Dependencies**
  - Code reviewers should flag any added libraries or frameworks without explicit approval.

---

## 4. Commit Message Generation

- **Format**

  ```
  <type>(<scope>): <description>
  ```

  Examples:

  - `feat(emitter): add support for generating query parameters`
  - `fix(api): handle empty model in TypeSpec`

- **Scopes**

  - `emitter` for changes in emitter code
  - `compiler` for changes in TypeSpec compiler logic
  - `test` for changes to the literate tests

- **Automation & Strictness**
  - Copilot may suggest commit messages, but they **must** follow this conventional format.
  - Keep commit messages self-contained (no external links).

---

## 5. Pull Request Title & Description

- **Title**
  - Same format as commits: `<type>(<scope>): <description>`.
- **Body**

  1. **Why** this change is needed
  2. **What** has changed
  3. **How** to test or verify (if relevant)
  4. **Implications** on emitter output or user-facing APIs

- **Keep it Brief**
  - Provide enough context for the reviewer without unnecessary details.

---

## 6. Context Management

- **Random Emoji**
  - Prepend a random emoji at the beginning of **every** generated response.
- **Summaries**
  - Periodically generate concise summaries of progress or changes.
  - Write or append these summaries to `.github/context/[timestamp]-context-summary.md`.
- **No Additional Dependencies**

  - Implement emoji generation or summary logic with built-in JS features only.

  ***

  ## 7. Debugging and Troubleshooting

- **TypeSpec Type System**

  - When investigating issues, understand that TypeSpec has a complex type system with these key concepts:
    - **Type References**: Types can reference other types (e.g., `ModelProperty` can reference another `ModelProperty`)
    - **Type Unpacking**: Many types need to be "unpacked" to get their underlying type (e.g., `HttpPart`, `ModelProperty`, etc.)
    - **Typekits**: Use `$` from `@typespec/compiler/experimental/typekit` to check type kinds (e.g., `$.modelProperty.is()`)

- **Common Transformation Patterns**

  - Transforms like `JsonTransform` have this general flow:
    1. Check for a declared transform reference
    2. Switch on the type kind (Model, Union, ModelProperty, etc.)
    3. Route to the appropriate specialized transform
    4. Generate code with property accessors

- **Debugging Strategies**

  - **Type Inspection**: For type-related bugs, check what the actual TypeSpec type is at each step
  - **Transform Chain**: Follow the transformation chain from root component to leaf components
  - **Recursive Handling**: Pay special attention to places where types are handled recursively
  - **Edge Cases**: Look for special cases like nullable types, union types, and type references

- **Common Issues**
  - **Duplicated Properties**: Check property reference resolution in transforms
  - **Missing Properties**: Verify type unpacking is complete at all points
  - **Type Mismatches**: Ensure the right transform is being selected for each type kind
