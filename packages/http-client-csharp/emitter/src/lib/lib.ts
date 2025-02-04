// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { NetEmitterOptionsSchema } from "../options.js";

const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-csharp",
  diagnostics: {
    "no-apiVersion": {
      severity: "error",
      messages: {
        default: paramMessage`No APIVersion Provider for service ${"service"}`,
      },
    },
    "no-route": {
      severity: "error",
      messages: {
        default: paramMessage`No Route for service for service ${"service"}`,
      },
    },
    "invalid-name": {
      severity: "warning",
      messages: {
        default: paramMessage`Invalid interface or operation group name ${"name"} when configuration "model-namespace" is on`,
      },
    },
    "general-warning": {
      severity: "warning",
      messages: {
        default: paramMessage`${"message"}`,
      },
    },
    "general-error": {
      severity: "error",
      messages: {
        default: paramMessage`${"message"}`,
      },
    },
    "invalid-dotnet-sdk-dependency": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid .NET SDK installed.`,
        missing: paramMessage`The dotnet command was not found in the PATH. Please install the .NET SDK version ${"dotnetMajorVersion"} or above. Guidance for installing the .NET SDK can be found at ${"downloadUrl"}.`,
        invalidVersion: paramMessage`The .NET SDK found is version ${"installedVersion"}. Please install the .NET SDK ${"dotnetMajorVersion"} or above and ensure there is no global.json in the file system requesting a lower version. Guidance for installing the .NET SDK can be found at ${"downloadUrl"}.`,
      },
    },
    "no-root-client": {
      severity: "error",
      messages: {
        default:
          "Cannot generate CSharp SDK since no public root client is defined in typespec file.",
      },
    },
    "unsupported-auth": {
      severity: "warning",
      messages: {
        default: paramMessage`${"message"}`,
      },
    },
    "unsupported-endpoint-url": {
      severity: "error",
      messages: {
        default: paramMessage`Unsupported server endpoint URL: ${"endpoint"}`,
      },
    },
    "unsupported-sdk-type": {
      severity: "error",
      messages: {
        default: paramMessage`Unsupported SDK type: ${"sdkType"}.`,
      },
    },
    "unsupported-default-value-type": {
      severity: "error",
      messages: {
        default: paramMessage`Unsupported default value type: ${"valueType"}.`,
      },
    },
    "unsupported-cookie-parameter": {
      severity: "error",
      messages: {
        default: paramMessage`Cookie parameter is not supported: ${"parameterName"}, found in operation ${"path"}`,
      },
    },
  },
  emitter: {
    options: NetEmitterOptionsSchema,
  },
});

/**
 * Reports a diagnostic. Defined in the core compiler.
 * @beta
 */
export const reportDiagnostic = $lib.reportDiagnostic;

/**
 * Creates a diagnostic. Defined in the core compiler.
 * @beta
 */
export const createDiagnostic = $lib.createDiagnostic;

/**
 * Gets a tracer. Defined in the core compiler.
 * @beta
 */
export const getTracer = $lib.getTracer;
