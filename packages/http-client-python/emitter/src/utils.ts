import {
  SdkHeaderParameter,
  SdkHttpParameter,
  SdkMethod,
  SdkModelPropertyType,
  SdkParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { getNamespaceFullName } from "@typespec/compiler";
import { PythonSdkContext } from "./lib.js";
import { getSimpleTypeResult, getType } from "./types.js";

function IsFullyUpperCase(identifier: string, maxUppercasePreserve: number) {
  const len = identifier.length;
  if (len > 1) {
    if (len <= maxUppercasePreserve && identifier === identifier.toUpperCase()) {
      return true;
    }

    if (len <= maxUppercasePreserve + 1 && identifier.endsWith("s")) {
      const i = identifier.substring(0, len - 1);
      if (i.toUpperCase() === i) {
        return true;
      }
    }
  }
  return false;
}

function deconstruct(
  identifier: string | Array<string>,
  maxUppercasePreserve: number,
): Array<string> {
  if (Array.isArray(identifier)) {
    return [...identifier.flatMap((each) => deconstruct(each, maxUppercasePreserve))];
  }

  return `${identifier}`
    .replace(/([a-z]+)([A-Z])/g, "$1 $2") // Add a space in between camelCase words(e.g. fooBar => foo Bar)
    .replace(/(\d+)/g, " $1 ") // Adds a space after numbers(e.g. foo123 => foo123 bar)
    .replace(/\b([A-Z]+)([A-Z])s([^a-z])(.*)/g, "$1$2« $3$4") // Add a space after a plural upper cased word(e.g. MBsFoo => MBs Foo)
    .replace(/\b([A-Z]+)([A-Z])([a-z]+)/g, "$1 $2$3") // Add a space between an upper case word(2 char+) and the last capital case.(e.g. SQLConnection -> SQL Connection)
    .replace(/«/g, "s")
    .trim()
    .split(/[\W|_]+/)
    .map((each) => (IsFullyUpperCase(each, maxUppercasePreserve) ? each : each.toLowerCase()));
}

function isEqual(s1: string, s2: string): boolean {
  // when s2 is undefined and s1 is the string 'undefined', it returns 0, making this true.
  // To prevent that, first we need to check if s2 is undefined.
  return s2 !== undefined && !!s1 && !s1.localeCompare(s2, undefined, { sensitivity: "base" });
}

function removeSequentialDuplicates(identifier: Iterable<string>) {
  const ids = [...identifier].filter((each) => !!each);
  for (let i = 0; i < ids.length; i++) {
    while (isEqual(ids[i], ids[i - 1])) {
      ids.splice(i, 1);
    }
    while (isEqual(ids[i], ids[i - 2]) && isEqual(ids[i + 1], ids[i - 1])) {
      ids.splice(i, 2);
    }
  }

  return ids;
}

function normalize(
  identifier: string | Array<string>,
  removeDuplicates = true,
  maxUppercasePreserve = 0,
): Array<string> {
  if (!identifier || identifier.length === 0) {
    return [""];
  }
  return typeof identifier === "string"
    ? normalize(
        deconstruct(identifier, maxUppercasePreserve),
        removeDuplicates,
        maxUppercasePreserve,
      )
    : removeDuplicates
      ? removeSequentialDuplicates(identifier)
      : identifier;
}

export function camelToSnakeCase(name: string): string {
  if (!name) return name;
  const words = normalize(name, false, 6);
  const result = words.join("_").toLowerCase();
  const result_final = result.replace(/([^\d])_(\d+)/g, "$1$2");
  return result_final;
}

export function removeUnderscoresFromNamespace(name?: string): string {
  // needed because of the _specs_ tests
  return (name || "").replace(/_/g, "");
}

export function getImplementation<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  parameter: SdkParameter | SdkHttpParameter,
): "Client" | "Method" {
  if (parameter.onClient) return "Client";
  return "Method";
}

export function isAbstract<TServiceOperation extends SdkServiceOperation>(
  method: SdkServiceMethod<TServiceOperation>,
): boolean {
  return (method.operation.bodyParam?.contentTypes.length ?? 0) > 1 && method.access !== "internal";
}

export function getDelimiterAndExplode(
  parameter: SdkQueryParameter | SdkHeaderParameter,
): [string | undefined, boolean] {
  if (parameter.type.kind !== "array") return [undefined, false];
  let delimiter: string | undefined = undefined;
  let explode = parameter.kind === "query" && parameter.explode;
  if (parameter.collectionFormat === "csv" || parameter.collectionFormat === "simple") {
    delimiter = "comma";
  } else if (parameter.collectionFormat === "ssv") {
    delimiter = "space";
  } else if (parameter.collectionFormat === "tsv") {
    delimiter = "tab";
  } else if (parameter.collectionFormat === "pipes") {
    delimiter = "pipe";
  } else {
    explode = true;
  }
  return [delimiter, explode];
}

type ParamBase = {
  optional: boolean;
  description: string;
  addedOn: string | undefined;
  clientName: string;
  inOverload: boolean;
  isApiVersion: boolean;
  type: Record<string, any>;
};

export function getAddedOn<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: SdkModelPropertyType | SdkMethod<TServiceOperation>,
): string | undefined {
  // since we do not support multi-service for now, we can just check the root client's api version
  // if type is added in the first version of the client, we do not need to add the versioning info
  if (
    type.apiVersions[0] ===
    context.sdkPackage.clients.find((c) => c.initialization.access === "public")?.apiVersions[0]
  )
    return undefined;
  return type.apiVersions[0];
}

export function emitParamBase<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  parameter: SdkParameter | SdkHttpParameter,
): ParamBase {
  let type = getType(context, parameter.type);
  if (parameter.isApiVersionParam) {
    if (parameter.clientDefaultValue) {
      type = getSimpleTypeResult({
        type: "constant",
        value: parameter.clientDefaultValue,
        valueType: type,
      });
    }
  }
  return {
    optional: parameter.optional,
    description: parameter.description || "",
    addedOn: getAddedOn(context, parameter),
    clientName: camelToSnakeCase(parameter.name),
    inOverload: false,
    isApiVersion: parameter.isApiVersionParam,
    type,
  };
}

export function isAzureCoreErrorResponse(t: SdkType | undefined): boolean {
  if (!t) return false;
  const tspType = t.__raw;
  if (!tspType) return false;
  return (
    tspType.kind === "Model" &&
    tspType.namespace !== undefined &&
    ["Azure.Core", "Azure.Core.Foundations"].includes(getNamespaceFullName(tspType.namespace)) &&
    tspType.name === "ErrorResponse"
  );
}

export function getDescriptionAndSummary<TServiceOperation extends SdkServiceOperation>(
  method: SdkMethod<TServiceOperation>,
): { description?: string; summary?: string } {
  if (method.details) {
    return {
      description: method.details,
      summary: method.description,
    };
  }
  return {
    description: method.description ?? "",
  };
}

export function capitalize(name: string): string {
  return name[0].toUpperCase() + name.slice(1);
}
