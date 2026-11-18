// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type {
  SdkClientType,
  SdkEnumType,
  SdkHttpOperation,
} from "@azure-tools/typespec-client-generator-core";
import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import type { Diagnostic } from "@typespec/compiler";
import { createDiagnosticCollector, NoTarget } from "@typespec/compiler";
import type { CSharpEmitterContext } from "../sdk-context.js";
import type { CodeModel } from "../type/code-model.js";
import type {
  InputClient,
  InputEnumType,
  InputLiteralType,
  InputModelType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { fromSdkClients } from "./client-converter.js";
import { createDiagnostic } from "./lib.js";
import { updateModelConstructorRequirements } from "./model-constructor.js";
import { fromSdkNamespaces } from "./namespace-converter.js";
import { processServiceAuthentication } from "./service-authentication.js";
import { fromSdkType, normalizeLiteralTypeForProperty } from "./type-converter.js";
import { getClientNamespaceString } from "./utils.js";

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
  updateModelConstructorRequirements(sdkContext);

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
  // by crossLanguageDefinitionId when available, falling back to a name-only key for
  // anonymous types (empty crossLanguageDefinitionId). This avoids duplicates when TCGC
  // produces a different reference for the same logical anonymous type (e.g. inline-union
  // operation-parameter enums) where the namespace can be inconsistent across emission
  // paths. Distinct named types that share a name across different namespaces still have
  // distinct crossLanguageDefinitionIds and are preserved.
  // Metadata selections retain distinct enum identities even if their anonymous names collide.
  const existingEnumKeys = new Set(enums.map((e) => typeDedupeKey(e)));
  const existingEnums = new Set(enums);
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
      if (
        existingEnums.has(enumType) ||
        (existingEnumKeys.has(key) && !sdkContext.__typeCache.lroMetadataEnums.has(enumType))
      ) {
        continue;
      }
      enums.push(enumType);
      existingEnums.add(enumType);
      if (!sdkContext.__typeCache.lroMetadataEnums.has(enumType)) {
        existingEnumKeys.add(key);
      }
    }
  }

  // TODO -- TCGC now does not have constants field in its sdkPackage, they might add it in the future.
  const constants = Array.from(sdkContext.__typeCache.constants.values());

  // Fix naming conflicts for constants, enums, and models
  fixNamingConflicts(
    models,
    enums,
    constants,
    sdkContext.__typeCache.lroMetadataEnums,
    typesBeforeClients,
    sdkContext.__typeCache.clients.values(),
  );

  // Resolve the root namespace. When this cannot be determined the generated code model
  // has no name, which the .NET generator rejects with an opaque root-level deserialization
  // failure. Surface a clear, actionable diagnostic here instead and let the caller skip
  // generation. See https://github.com/microsoft/typespec/issues/10914.
  const clientNamespace = getClientNamespaceString(sdkContext);
  if (clientNamespace === undefined) {
    diagnostics.add(
      createDiagnostic({
        code: "unresolved-client-namespace",
        target: NoTarget,
      }),
    );
  }

  const clientModel: CodeModel = {
    name: clientNamespace ?? "",
    apiVersions: rootApiVersions,
    enums: enums,
    constants: constants,
    models: models,
    clients: inputClients,
    auth: diagnostics.pipe(processServiceAuthentication(sdkContext, sdkPackage)),
  };
  const unions = [...sdkContext.__typeCache.types.values()].filter(
    (type): type is InputUnionType => type.kind === "union" && type.baseModel !== undefined,
  );
  if (unions.length > 0) clientModel.unions = unions;

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
function fixNamingConflicts(
  models: InputModelType[],
  enums: InputEnumType[],
  constants: InputLiteralType[],
  lroMetadataEnums: Set<InputEnumType>,
  typesBeforeClients: Set<InputType>,
  clients: Iterable<InputClient>,
): void {
  const modelEnums = new Set<InputEnumType>();
  // First, fix names for constants and constant-derived enums in model properties
  for (const model of models) {
    for (const property of model.properties) {
      const type = property.type;
      let nestedType = type;
      while (nestedType.kind === "nullable") nestedType = nestedType.type;
      if (nestedType.kind === "enum") modelEnums.add(nestedType);

      if (type.kind === "constant") {
        // Fix constant property names
        normalizeLiteralTypeForProperty(type, model, property.name);
      } else if (type.kind === "enum" && type.crossLanguageDefinitionId === "") {
        // Fix enum names for enums created from constants
        normalizeLiteralTypeForProperty(type, model, property.name);
        if (lroMetadataEnums.has(type)) {
          type.usage |= UsageFlags.Output | UsageFlags.Json;
        }
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

  // Metadata enums must have distinct C# type and output file names without renaming existing types.
  const usedTypeNames = new Set([...clients].map(csharpTypeNameKey));
  for (const model of models) {
    const name = csharpTypeNameKey(model);
    usedTypeNames.add(name);
    if (!model.isExactName) {
      // ModelProvider may project Request/Response suffixes to Content/Result.
      if (name.endsWith("REQUEST")) usedTypeNames.add(`${name.slice(0, -7)}CONTENT`);
      if (name.endsWith("RESPONSE")) usedTypeNames.add(`${name.slice(0, -8)}RESULT`);
    }
  }
  for (const type of enums) {
    if (!lroMetadataEnums.has(type) || typesBeforeClients.has(type)) {
      usedTypeNames.add(csharpTypeNameKey(type));
    }
  }
  const metadataEnums = enums
    .filter((type) => lroMetadataEnums.has(type) && !typesBeforeClients.has(type))
    .sort((a, b) => Number(modelEnums.has(b)) - Number(modelEnums.has(a)));
  for (const type of metadataEnums) {
    const baseName = type.name;
    let suffix = 1;
    while (usedTypeNames.has(csharpTypeNameKey(type))) {
      type.name = `${baseName}${suffix++}`;
    }
    usedTypeNames.add(csharpTypeNameKey(type));
  }
}

function csharpTypeNameKey(type: { name: string; isExactName?: boolean }): string {
  if (type.isExactName) return type.name.toUpperCase();
  // C# checks UTF-16 code units and removes separators (including underscores).
  const codeUnits = type.name.replace(/[\uD800-\uDFFF]/g, " ");
  const startsWithDigit = /^\p{Nd}/u.test(codeUnits);
  const start = startsWithDigit ? 0 : codeUnits.search(/[\p{L}\p{Nl}_]/u);
  const name = start < 0 ? codeUnits : codeUnits.slice(start);
  return `${startsWithDigit ? "_" : ""}${name.replace(
    /_|[^\p{L}\p{Nl}\p{Nd}\p{Mn}\p{Mc}\p{Pc}\p{Cf}]/gu,
    "",
  )}`.toUpperCase();
}

/**
 * Dedupe key for a model or enum. Uses `crossLanguageDefinitionId` when present;
 * otherwise falls back to `anon:${name}` since TCGC may report inconsistent
 * namespaces for the same anonymous type across emission paths.
 */
function typeDedupeKey(type: InputModelType | InputEnumType): string {
  if (type.crossLanguageDefinitionId) {
    return type.crossLanguageDefinitionId;
  }
  return `anon:${type.name}`;
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
