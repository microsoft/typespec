import { Diagnostic, Program, Type } from "@typespec/compiler";
import { createDiagnostic, createStateSymbol } from "../lib.js";
import { SupportedOpenAPIDocuments } from "../types.js";

export interface ComponentFixedFieldKeyContext {
  invalidKeys: Set<string>;
  diagnostics: Map<string, Diagnostic>;
}

export const invalidComponentFixedFieldKey = createStateSymbol("invalidComponentFixedField");

export function setUpComponentFixedFieldKeyContext(program: Program) {
  const context: ComponentFixedFieldKeyContext = {
    invalidKeys: new Set(),
    diagnostics: new Map(),
  };
  program.stateMap(invalidComponentFixedFieldKey).set(program.getGlobalNamespaceType(), context);
}

export function getComponentFixedFieldKeyContext(program: Program) {
  return program
    .stateMap(invalidComponentFixedFieldKey)
    .get(program.getGlobalNamespaceType()) as ComponentFixedFieldKeyContext;
}

export function validateComponentFixedFieldKey(program: Program, type: Type, keyInOpenAPI: string) {
  if (!isValidComponentFixedFieldKey(keyInOpenAPI)) {
    const { invalidKeys, diagnostics } = getComponentFixedFieldKeyContext(program);
    if (!invalidKeys.has(keyInOpenAPI)) {
      const isParameter = type.kind === "ModelProperty";
      if (isParameter) invalidKeys.add(keyInOpenAPI);
      else invalidKeys.add(keyInOpenAPI);
    }
    const diagnostic = createDiagnostic({
      code: "invalid-component-fixed-field-key",
      format: {
        value: keyInOpenAPI,
      },
      target: type,
    });
    diagnostics.set(keyInOpenAPI, diagnostic);
  }

  function isValidComponentFixedFieldKey(key: string) {
    const validPattern = /^[a-zA-Z0-9.\-_]+$/;
    return validPattern.test(key);
  }
}

export function useValidKeysInComponentFixedFields(
  result: Map<string, string>,
  invalidKeys: Set<string>,
  pairs: Record<string, unknown>,
): typeof pairs {
  if (!pairs) return pairs;

  const newPairs: typeof pairs = {};
  const originalKeys = Object.keys(pairs);
  const validKeys = new Set<string>(originalKeys.filter((key) => !invalidKeys.has(key)));

  for (const [_, key] of originalKeys.entries()) {
    if (validKeys.has(key)) {
      newPairs[key] = pairs[key];
      continue;
    }

    const newKey = createValidKey(key, validKeys, newPairs);
    newPairs[newKey] = pairs[key];
    result.set(key, newKey);
  }

  return newPairs;

  function createValidKey(
    invalidKey: string,
    originalValidKeys: Set<string>,
    newPairs: Record<string, unknown>,
  ): string {
    let baseKey = invalidKey.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    let index = 1;
    let validKey = baseKey;

    for (let validKey = baseKey; validKey in originalValidKeys || validKey in newPairs; index++) {
      validKey = baseKey + index;
    }
    return validKey;
  }
}

export function updateToValidRefs(program: Program, root: SupportedOpenAPIDocuments) {
  const invalidRefs = getComponentFixedFieldKeyContext(program).invalidKeys;
  const modelNameMap = new Map<string, string>();
  if (root.components?.schemas) {
    root.components.schemas = useValidKeysInComponentFixedFields(
      modelNameMap,
      invalidRefs,
      root.components.schemas,
    ) as typeof root.components.schemas;
  }
  if (root.components?.parameters) {
    root.components.parameters = useValidKeysInComponentFixedFields(
      modelNameMap,
      invalidRefs,
      root.components.parameters,
    ) as typeof root.components.parameters;
  }
  for (const [invalidRef, validRef] of modelNameMap) {
    updateRefs(root, invalidRef, validRef);
  }

  function isParameterRef(ref: string) {
    return ref.startsWith("#/components/parameters/");
  }

  function getParameterKey(ref: string) {
    return ref.replace("#/components/parameters/", "");
  }

  function getSchemaKey(ref: string) {
    return ref.replace("#/components/schemas/", "");
  }

  function updateRefs(obj: any, oldKey: string, newKey: string) {
    if (obj.$ref) {
      if (isParameterRef(obj.$ref)) {
        const parameterKey = getParameterKey(obj.$ref);
        if (parameterKey === oldKey)
          obj.$ref = `#/components/parameters/${encodeURIComponent(newKey)}`;
      } else {
        const schemaKey = getSchemaKey(obj.$ref);
        if (schemaKey === oldKey) obj.$ref = `#/components/schemas/${newKey}`;
      }
    }
    for (const key in obj) {
      if (key.startsWith("x-")) continue;
      if (typeof obj[key] === "object") updateRefs(obj[key], oldKey, newKey);
    }
  }
}
