// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type {
  SdkClientType,
  SdkHttpOperation,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import {
  createMetadataInfo,
  isVisible,
  resolveRequestVisibility,
  Visibility,
} from "@typespec/http";
import type { CSharpEmitterContext } from "../sdk-context.js";

export function updateModelConstructorRequirements(sdkContext: CSharpEmitterContext): void {
  const metadata = createMetadataInfo(sdkContext.program);
  const visited = new Map<SdkType, Set<string>>();

  function visitType(
    type: SdkType,
    visibility: Visibility,
    inExplicitBody = false,
    includeSubtypes = true,
  ): void {
    const contexts = visited.get(type) ?? new Set<string>();
    const context = `${visibility}:${inExplicitBody}:${includeSubtypes}`;
    if (contexts.has(context)) return;
    contexts.add(context);
    visited.set(type, contexts);

    switch (type.kind) {
      case "nullable":
        visitType(type.type, visibility, inExplicitBody);
        break;
      case "array":
      case "dict":
        visitType(type.valueType, visibility | Visibility.Item, inExplicitBody);
        break;
      case "union":
        for (const variant of type.variantTypes) {
          visitType(variant, visibility, inExplicitBody);
        }
        break;
      case "model":
        // Ancestors supply inherited properties, not additional request subtypes.
        if (type.baseModel) visitType(type.baseModel, visibility, inExplicitBody, false);
        if (includeSubtypes) {
          for (const subtype of Object.values(type.discriminatedSubtypes ?? {})) {
            visitType(subtype, visibility, inExplicitBody);
          }
        }
        if (type.additionalProperties) {
          visitType(type.additionalProperties, visibility | Visibility.Item, inExplicitBody);
        }
        for (const property of type.properties) {
          const raw = property.__raw;
          const inPayload = !raw || metadata.isPayloadProperty(raw, visibility, inExplicitBody);
          const inputProperty = sdkContext.__typeCache.properties.get(property);
          if (
            inputProperty &&
            !inputProperty.readOnly &&
            !property.optional &&
            !property.discriminator &&
            raw &&
            (!isVisible(sdkContext.program, raw, visibility) ||
              (inPayload && metadata.isOptional(raw, visibility)))
          ) {
            inputProperty.requiredInConstructor = false;
          }
          if (inPayload) visitType(property.type, visibility, inExplicitBody);
        }
        break;
    }
  }

  function visitClient(client: SdkClientType<SdkHttpOperation>): void {
    for (const method of client.methods) {
      const operation = method.operation;
      const visibility = resolveRequestVisibility(
        sdkContext.program,
        operation.__raw.operation,
        operation.verb,
      );
      // PUT and visibility overrides can support multiple lifecycle contexts.
      // A shared constructor must allow properties omitted in any of them.
      for (const lifecycle of [
        Visibility.Read,
        Visibility.Create,
        Visibility.Update,
        Visibility.Delete,
        Visibility.Query,
      ]) {
        if (!(visibility & lifecycle)) continue;
        const context = lifecycle | (visibility & Visibility.Patch);
        if (operation.bodyParam) {
          const body = operation.__raw.parameters.body;
          visitType(
            operation.bodyParam.type,
            context,
            body?.bodyKind === "single" && body.isExplicit,
          );
        }
        for (const parameter of operation.parameters) {
          visitType(parameter.type, context & ~Visibility.Patch);
        }
      }
    }
    for (const child of client.children ?? []) {
      visitClient(child);
    }
  }

  for (const client of sdkContext.sdkPackage.clients) {
    visitClient(client);
  }
}
