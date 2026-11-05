// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type {
  SdkClientType,
  SdkHttpOperation,
  SdkModelType,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import {
  createMetadataInfo,
  isBodyIgnore,
  isVisible,
  resolveRequestVisibility,
  Visibility,
} from "@typespec/http";
import type { CSharpEmitterContext } from "../sdk-context.js";

export function updateModelConstructorRequirements(sdkContext: CSharpEmitterContext): void {
  const metadata = createMetadataInfo(sdkContext.program);
  const visited = new Map<SdkType, Set<string>>();

  function visitType(type: SdkType, visibility: Visibility, inExplicitBody = false): void {
    const contexts = visited.get(type) ?? new Set<string>();
    const context = `${visibility}:${inExplicitBody}`;
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
      case "model": {
        for (const subtype of Object.values(type.discriminatedSubtypes ?? {})) {
          visitType(subtype, visibility, inExplicitBody);
        }
        // Walk effective inherited properties without treating ancestors as request types.
        const propertyNames = new Set<string>();
        for (let model: SdkModelType | undefined = type; model; model = model.baseModel) {
          if (model.additionalProperties) {
            visitType(model.additionalProperties, visibility | Visibility.Item, inExplicitBody);
          }
          for (const property of model.properties) {
            if (propertyNames.has(property.name)) continue;
            propertyNames.add(property.name);
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
                (!inExplicitBody && isBodyIgnore(sdkContext.program, raw)) ||
                (inPayload && metadata.isOptional(raw, visibility)))
            ) {
              inputProperty.requiredInConstructor = false;
            }
            if (inPayload) visitType(property.type, visibility, inExplicitBody);
          }
        }
        break;
      }
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
