export { resolveCompilerOptions, ResolveCompilerOptionsOptions } from "./config/index.js";
export * from "./core/index.js";
export * as TypeSpecPrettierPlugin from "./formatter/index.js";
export * from "./lib/decorators.js";
export {
  CompileResult,
  createServer,
  TypeSpecLanguageConfiguration,
  type CustomRequestName,
  type InitProjectConfig,
  type InitProjectContext,
  type InitProjectTemplate,
  type InitProjectTemplateEmitterTemplate,
  type InitProjectTemplateLibrarySpec,
  type SemanticToken,
  type SemanticTokenKind,
  type Server,
  type ServerCustomCapacities,
  type ServerHost,
  type ServerInitializeResult,
  type ServerLog,
  type ServerLogLevel,
  type ServerSourceFile,
  type ServerWorkspaceFolder,
} from "./server/index.js";
export type { PackageJson } from "./types/package-json.js";

import { $decorators as intrinsicDecorators } from "./lib/intrinsic/tsp-index.js";
import { $decorators as stdDecorators } from "./lib/tsp-index.js";
/** @internal for Typespec compiler */
export const $decorators = {
  TypeSpec: {
    ...stdDecorators.TypeSpec,
  },
  "TypeSpec.Prototypes": {
    ...intrinsicDecorators["TypeSpec.Prototypes"],
  },
};
