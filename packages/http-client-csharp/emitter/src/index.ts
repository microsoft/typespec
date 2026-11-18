// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { writeCodeModel } from "./code-model-writer.js";
export { configurationFileName, tspOutputFileName } from "./constants.js";
export { $onEmit, emitCodeModel } from "./emitter.js";
// we export `createModel` only for autorest.csharp because it uses the emitter to generate the code model file but not calling the dll here
// we could remove this export when in the future we deprecate autorest.csharp
export { createModel } from "./lib/client-model-builder.js";
export { $lib, createDiagnostic, getTracer, reportDiagnostic } from "./lib/lib.js";
export { LoggerLevel } from "./lib/logger-level.js";
export { Logger } from "./lib/logger.js";
export { CSharpEmitterOptionsSchema, defaultOptions, resolveOptions } from "./options.js";
export type { CSharpEmitterOptions } from "./options.js";
// we export `createCSharpEmitterContext` only for autorest.csharp because it uses the emitter to generate the code model file but not calling the dll here
// we could remove this export when in the future we deprecate autorest.csharp
export { createCSharpEmitterContext } from "./sdk-context.js";
export type { CSharpEmitterContext } from "./sdk-context.js";
export type { CodeModel } from "./type/code-model.js";
export type { InputClient, InputModelType } from "./type/input-type.js";
