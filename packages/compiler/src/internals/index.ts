/**
 * This file is meant to export internal items from the TypeSpec compiler to some other tools that bundle them.
 * DO NOT USE it, it might change at any time with no warning.
 */

if (!(globalThis as any).enableCompilerInternalsExport) {
  throw new Error("Importing @typespec/compiler/internals is reserved for internal use only.");
}

export { resolveCompilerOptions } from "../config/config-to-options.js";
export { NodeSystemHost } from "../core/node-system-host.js";
export { InitTemplateSchema } from "../init/init-template.js";
export { makeScaffoldingConfig, scaffoldNewProject } from "../init/scaffold.js";
export { InternalCompileResult, ServerDiagnostic } from "../server/index.js";
export { resolveEntrypointFile } from "../server/entry-point-resolve.js";
