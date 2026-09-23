// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { SdkContext } from "@azure-tools/typespec-client-generator-core";
import type { Diagnostic, Type } from "@typespec/compiler";
import { createDiagnosticCollector } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import "@typespec/http-client/typekit";
import type { InputExperimentalDetails } from "../type/input-type.js";
import { createDiagnostic } from "./lib.js";

export function getExperimentalDetails(
  context: SdkContext,
  target: Type | undefined,
  hasGeneratedDeclaration = true,
): [InputExperimentalDetails | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (!target) {
    return diagnostics.wrap(undefined);
  }

  const lifecycle = diagnostics.pipe(
    $(context.program).client.getFeatureLifecycleDetails.withDiagnostics(target, {
      emitterName: "@typespec/http-client-csharp",
    }),
  );
  if (lifecycle && !hasGeneratedDeclaration) {
    diagnostics.add(createDiagnostic({ code: "experimental-target-not-supported", target }));
    return diagnostics.wrap(undefined);
  }

  return diagnostics.wrap(
    lifecycle
      ? { diagnosticId: lifecycle.diagnosticId, dependsOn: [...lifecycle.dependsOn] }
      : undefined,
  );
}
