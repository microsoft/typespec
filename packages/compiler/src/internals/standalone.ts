/**
 * Internal API used to build a self-contained ("standalone") TypeSpec CLI that bundles the compiler
 * into a single executable.
 *
 * This is a separate entrypoint from `@typespec/compiler/internals` on purpose: `runTypeSpecCli`
 * reaches into the CLI runner, which transitively loads `node-host` (top-level `await`) and Node
 * built-ins. Keeping it out of the general `internals` barrel avoids forcing those onto every
 * browser/CommonJS consumer of `internals` (e.g. the VS Code extension and the playground).
 *
 * DO NOT USE. Not part of the public API and may change at any time with no warning.
 */
export { runTypeSpecCli } from "../core/cli/cli.js";
export { InMemoryTemplateSource } from "../init/template-source/index.js";
export type { LoadedTemplateIndex, TemplateSource } from "../init/template-source/index.js";
