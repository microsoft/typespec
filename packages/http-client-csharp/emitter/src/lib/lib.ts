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
  },
  emitter: {
    options: NetEmitterOptionsSchema,
  },
});

export const { reportDiagnostic, createDiagnostic, getTracer } = $lib;
