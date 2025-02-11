// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { configurationFileName, tspOutputFileName } from "./constants.js";
export { $onEmit } from "./emitter.js";
export { createDiagnostic, getTracer, reportDiagnostic } from "./lib/lib.js";
export { Logger, LoggerLevel } from "./lib/logger.js";
export {
  CSharpEmitterOptions,
  CSharpEmitterOptionsSchema,
  defaultOptions,
  resolveOptions,
} from "./options.js";
export { setSDKContextOptions } from "./sdk-context-options.js";
