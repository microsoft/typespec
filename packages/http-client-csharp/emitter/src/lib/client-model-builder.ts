// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkEnumType,
  SdkHttpOperation,
} from "@azure-tools/typespec-client-generator-core";
import { createDiagnosticCollector, Diagnostic } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { CodeModel } from "../type/code-model.js";
import { InputEnumType, InputLiteralType, InputModelType } from "../type/input-type.js";
import { fromSdkClients } from "./client-converter.js";
import { fromSdkNamespaces } from "./namespace-converter.js";
import { processServiceAuthentication } from "./service-authentication.js";
import { fromSdkType } from "./type-converter.js";
import { firstLetterToUpperCase, getClientNamespaceString } from "./utils.js";

/**
 * Creates the code model from the SDK context.
 * This function follows TypeSpec best practices by returning diagnostics alongside the result.
 *
 * @example
 * ```typescript
 * import { createModel } from "@typespec/http-client-csharp";
 *
 * const sdkContext = createCSharpEmitterContext(context, logger);
 * const [codeModel, diagnostics] = createModel(sdkContext);
 * // Process the code model and handle diagnostics
 * ```
 *
 * @param sdkContext - The SDK context
 * @returns A tuple containing the code model and any diagnostics that were generated
 * @beta
 */
export function createModel(sdkContext: CSharpEmitterContext): [CodeModel, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const sdkPackage = sdkContext.sdkPackage;

  // TO-DO: Consider exposing the namespace hierarchy in the code model https://github.com/microsoft/typespec/issues/8332
  diagnostics.pipe(fromSdkNamespaces(sdkContext, sdkPackage.namespaces));
  // TO-DO: Consider using the TCGC model + enum cache once https://github.com/Azure/typespec-azure/issues/3180 is resolved
  diagnostics.pipe(navigateModels(sdkContext));

  // Snapshot the set of type identities discovered during model/enum navigation before
  // processing clients. This lets us identify any *new* types added during operation
  // processing without duplicating types that were already captured.
  const typesBeforeClients = new Set(sdkContext.__typeCache.types.values());

  const rootClients = sdkPackage.clients;
  const rootApiVersions = parseApiVersions(sdkPackage.enums, rootClients);
  const inputClients = diagnostics.pipe(fromSdkClients(sdkContext, rootClients, rootApiVersions));

  const models: InputModelType[] = [];
  const enums: InputEnumType[] = [];
  const existingModelKeys = new Set<string>();
  for (const type of typesBeforeClients) {
    if (type.kind === "model") {
      const model = type as InputModelType;
      models.push(model);
      existingModelKeys.add(typeDedupeKey(model));
    } else if (type.kind === "enum") {
      enums.push(type as InputEnumType);
    }
  }
  // Include models and enums discovered only via operation processing (e.g., anonymous
  // response models for protocol-only paging operations where TCGC does not include the
  // response model in sdkPackage.models, or enums only reachable through nested property
  // types of such models). See https://github.com/microsoft/typespec/issues/9391. Dedupe
  // by crossLanguageDefinitionId when available, falling back to namespace + name for
  // anonymous types (empty crossLanguageDefinitionId). This avoids duplicates when TCGC
  // produces a different reference for the same logical type, while still preserving
  // distinct types that share a name across different namespaces.
  const existingEnumKeys = new Set(enums.map((e) => typeDedupeKey(e)));
  for (const type of sdkContext.__typeCache.types.values()) {
    if (typesBeforeClients.has(type)) continue;
    if (type.kind === "model") {
      const model = type as InputModelType;
      const key = typeDedupeKey(model);
      if (existingModelKeys.has(key)) continue;
      models.push(model);
      existingModelKeys.add(key);
    } else if (type.kind === "enum") {
      const enumType = type as InputEnumType;
      const key = typeDedupeKey(enumType);
      if (existingEnumKeys.has(key)) continue;
      enums.push(enumType);
      existingEnumKeys.add(key);
    }
  }

  // TODO -- TCGC now does not have constants field in its sdkPackage, they might add it in the future.
  const constants = Array.from(sdkContext.__typeCache.constants.values());

  // Fix naming conflicts for constants, enums, and models
  fixNamingConflicts(models, constants);

  const clientModel: CodeModel = {
    name: getClientNamespaceString(sdkContext)!,
    apiVersions: rootApiVersions,
    enums: enums,
    constants: constants,
    models: models,
    clients: inputClients,
    auth: diagnostics.pipe(processServiceAuthentication(sdkContext, sdkPackage)),
  };

  return diagnostics.wrap(clientModel);
}

/**
 * Parses and returns the correct API versions for the library.
 * Handles both regular and multiservice client libraries.
 *
 * @param enums - Array of enums from the SDK package
 * @param rootClients - Array of root clients from the SDK package
 * @returns Array of API version strings
 */
function parseApiVersions(
  enums: SdkEnumType[],
  rootClients: SdkClientType<SdkHttpOperation>[],
): string[] {
  // Always use client.apiVersions as the source of truth.
  return rootClients[0]?.apiVersions ?? [];
}

/**
 * Fixes naming conflicts for constants, enums, and models.
 *
 * TODO - TCGC has two issues which come from the same root cause: the name determination algorithm based on the typespec node of the constant.
 * Typespec itself will always use the same node/Type instance for the same value constant, therefore a lot of names are not correct.
 * issues:
 * - https://github.com/Azure/typespec-azure/issues/2572 (constants in operations)
 * - https://github.com/Azure/typespec-azure/issues/2563 (constants in models)
 *
 * @param models - Array of input model types
 * @param enums - Array of input enum types
 * @param constants - Array of input literal types (constants)
 */
function fixNamingConflicts(models: InputModelType[], constants: InputLiteralType[]): void {
  // First, fix names for constants and constant-derived enums in model properties
  for (const model of models) {
    for (const property of model.properties) {
      const type = property.type;

      if (type.kind === "constant") {
        // Fix constant property names
        type.name = `${model.name}${firstLetterToUpperCase(property.name)}`;
        type.namespace = model.namespace;
        type.access = model.access;
        type.usage = model.usage;
      } else if (type.kind === "enum" && type.crossLanguageDefinitionId === "") {
        // Fix enum names for enums created from constants
        type.name = `${model.name}${firstLetterToUpperCase(property.name)}`;
        type.namespace = model.namespace;
        type.access = model.access;
        type.usage = model.usage;
      }
    }
  }

  // Second, handle remaining naming conflicts by numbering duplicates
  // This covers constants used as operation parameters and other edge cases
  const constantNameMap = new Map<string, number>();
  for (const constant of constants) {
    const count = constantNameMap.get(constant.name);
    if (count) {
      constantNameMap.set(constant.name, count + 1);
      constant.name = `${constant.name}${count}`;
    } else {
      constantNameMap.set(constant.name, 1);
    }
  }

  // Third, handle duplicate model names within the same namespace
  // This can occur when namespace option is specified and models from different
  // source namespaces end up in the same target namespace
  const modelNameMap = new Map<string, number>();
  for (const model of models) {
    // Use namespace + name as the key to detect duplicates within the same namespace
    const key = `${model.namespace}.${model.name}`;
    const count = modelNameMap.get(key);
    if (count) {
      modelNameMap.set(key, count + 1);
      model.name = `${model.name}${count}`;
    } else {
      modelNameMap.set(key, 1);
    }
  }
}

/**
 * Returns a key for a model or enum type. Prefers `crossLanguageDefinitionId`
 * because it is the canonical identity TCGC assigns. Falls back to `namespace.name`
 * for anonymous/constant-derived types whose `crossLanguageDefinitionId` is empty.
 */
function typeDedupeKey(type: InputModelType | InputEnumType): string {
  return type.crossLanguageDefinitionId || `${type.namespace}.${type.name}`;
}

function navigateModels(sdkContext: CSharpEmitterContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const m of sdkContext.sdkPackage.models) {
    diagnostics.pipe(fromSdkType(sdkContext, m));
  }
  for (const e of sdkContext.sdkPackage.enums) {
    diagnostics.pipe(fromSdkType(sdkContext, e));
  }
  return diagnostics.wrap(undefined as void);
}
