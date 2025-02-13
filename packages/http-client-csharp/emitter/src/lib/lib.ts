// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { createTypeSpecLibrary, DiagnosticMap, DiagnosticMessages, paramMessage } from "@typespec/compiler";
import { CSharpEmitterOptionsSchema } from "../options.js";

export const diagMessages = {
  "no-apiVersion": {
    default: paramMessage`No APIVersion Provider for service ${"service"}`,
  },
  "no-route": {
      default: paramMessage`No Route for service for service ${"service"}`,
  },
  "general-warning": {
    default: paramMessage`${"message"}`,
  },
  "general-error": {
    default: paramMessage`${"message"}`,
  },
  "invalid-dotnet-sdk-dependency": {
    default: paramMessage`Invalid .NET SDK installed.`,
    missing: paramMessage`The dotnet command was not found in the PATH. Please install the .NET SDK version ${"dotnetMajorVersion"} or above. Guidance for installing the .NET SDK can be found at ${"downloadUrl"}.`,
    invalidVersion: paramMessage`The .NET SDK found is version ${"installedVersion"}. Please install the .NET SDK ${"dotnetMajorVersion"} or above and ensure there is no global.json in the file system requesting a lower version. Guidance for installing the .NET SDK can be found at ${"downloadUrl"}.`,
  },
  "no-root-client": {
    default: "Cannot generate CSharp SDK since no public root client is defined in typespec file.",
  },
  "unsupported-auth": {
      default: paramMessage`${"message"}`,
  },
  "client-namespace-conflict": {
      default: paramMessage`namespace ${"clientNamespace"} conflicts with client ${"clientName"}, please use @clientName to specify a different name for the client.`,
  },
  "unsupported-endpoint-url": {
      default: paramMessage`Unsupported server endpoint URL: ${"endpoint"}`,
  },
  "unsupported-sdk-type": {
    default: paramMessage`Unsupported SDK type: ${"sdkType"}.`,
  },
  "unsupported-default-value-type": {
      default: paramMessage`Unsupported default value type: ${"valueType"}.`,
  },
  "unsupported-cookie-parameter": {
      default: paramMessage`Cookie parameter is not supported: ${"parameterName"}, found in operation ${"path"}`,
  },
  "unsupported-patch-convenience-method": {
      default: paramMessage`Convenience method is not supported for PATCH method, it will be turned off. Please set the '@convenientAPI' to false for operation ${"methodCrossLanguageDefinitionId"}.`,
  },
}

const diags: DiagnosticMap<typeof diagMessages> = {
  "no-apiVersion": {
    severity: "error",
    messages: diagMessages["no-apiVersion"],
  },
  "no-route": {
    severity: "error",
    messages: diagMessages["no-route"],
  },
  "general-warning": {
    severity: "warning",
    messages: diagMessages["general-warning"],
  },
  "general-error": {
    severity: "error",
    messages: diagMessages["general-error"],
  },
  "invalid-dotnet-sdk-dependency": {
    severity: "error",
    messages: diagMessages["invalid-dotnet-sdk-dependency"],
  },
  "no-root-client": {
    severity: "error",
    messages: diagMessages["no-root-client"],
  },
  "unsupported-auth": {
    severity: "warning",
    messages: diagMessages["unsupported-auth"],
  },
  "client-namespace-conflict": {
    severity: "warning",
    messages: diagMessages["client-namespace-conflict"],
  },
  "unsupported-endpoint-url": {
    severity: "error",
    messages: diagMessages["unsupported-endpoint-url"],
  },
  "unsupported-sdk-type": {
    severity: "error",
    messages: diagMessages["unsupported-sdk-type"],
  },
  "unsupported-default-value-type": {
    severity: "error",
    messages: diagMessages["unsupported-default-value-type"],
  },
  "unsupported-cookie-parameter": {
    severity: "error",
    messages: diagMessages["unsupported-cookie-parameter"],
  },
  "unsupported-patch-convenience-method": {
    severity: "warning",
    messages: diagMessages["unsupported-patch-convenience-method"],
  },
};

const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-csharp",
  diagnostics: diags,
  emitter: {
    options: CSharpEmitterOptionsSchema,
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
