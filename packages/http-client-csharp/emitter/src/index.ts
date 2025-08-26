// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { writeCodeModel } from "./code-model-writer.js";
export { configurationFileName, tspOutputFileName } from "./constants.js";
export { $onEmit } from "./emitter.js";
// we export `createModel` only for autorest.csharp because it uses the emitter to generate the code model file but not calling the dll here
// we could remove this export when in the future we deprecate autorest.csharp
export { createModel } from "./lib/client-model-builder.js";
export { $lib, createDiagnostic, getTracer, reportDiagnostic } from "./lib/lib.js";
export { LoggerLevel } from "./lib/logger-level.js";
export { Logger } from "./lib/logger.js";
export {
  CSharpEmitterOptions,
  CSharpEmitterOptionsSchema,
  defaultOptions,
  resolveOptions,
} from "./options.js";
// we export `createCSharpEmitterContext` only for autorest.csharp because it uses the emitter to generate the code model file but not calling the dll here
// we could remove this export when in the future we deprecate autorest.csharp
export { CSharpEmitterContext, createCSharpEmitterContext } from "./sdk-context.js";
export { CodeModel } from "./type/code-model.js";
export { InputClient, InputModelType } from "./type/input-type.js";
export { $dynamicModel, isDynamicModel } from "./lib/decorators.js";

/** @internal */
export { $decorators } from "./tsp-index.js";

export type { DynamicModelDecorator } from "../generated-defs/TypeSpec.Http.Client.CSharp.js";
