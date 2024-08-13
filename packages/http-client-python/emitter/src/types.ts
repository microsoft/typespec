import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBuiltInType,
  SdkConstantType,
  SdkCredentialType,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEndpointType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelType,
  SdkServiceOperation,
  SdkType,
  SdkUnionType,
} from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { HttpAuth, Visibility } from "@typespec/http";
import { dump } from "js-yaml";
import { PythonSdkContext } from "./lib.js";
import { camelToSnakeCase, emitParamBase, getAddedOn, getImplementation } from "./utils.js";

export const typesMap = new Map<SdkType, Record<string, any>>();
export const simpleTypesMap = new Map<string | null, Record<string, any>>();

export interface CredentialType {
  kind: "Credential";
  scheme: HttpAuth;
}

export interface CredentialTypeUnion {
  kind: "CredentialTypeUnion";
  types: CredentialType[];
}

function isEmptyModel(type: SdkType): boolean {
  // object, {} will be treated as empty model, user defined empty model will not
  return (
    type.kind === "model" &&
    type.properties.length === 0 &&
    !type.baseModel &&
    !type.discriminatedSubtypes &&
    !type.discriminatorValue &&
    (type.isGeneratedName || type.name === "object")
  );
}

export function getSimpleTypeResult(result: Record<string, any>): Record<string, any> {
  const key = dump(result, { sortKeys: true });
  const value = simpleTypesMap.get(key);
  if (value) {
    result = value;
  } else {
    simpleTypesMap.set(key, result);
  }
  return result;
}

export function getType<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: CredentialType | CredentialTypeUnion | Type | SdkType,
  fromBody = false
): Record<string, any> {
  switch (type.kind) {
    case "model":
      return emitModel(context, type, fromBody);
    case "union":
      return emitUnion(context, type);
    case "enum":
      return emitEnum(type);
    case "constant":
      return emitConstant(type)!;
    case "array":
    case "dict":
      return emitArrayOrDict(context, type)!;
    case "utcDateTime":
    case "offsetDateTime":
    case "duration":
      return emitDurationOrDateType(type);
    case "enumvalue":
      return emitEnumMember(type, emitEnum(type.enumType));
    case "credential":
      return emitCredential(type);
    case "bytes":
    case "boolean":
    case "plainDate":
    case "plainTime":
    case "numeric":
    case "integer":
    case "safeint":
    case "int8":
    case "uint8":
    case "int16":
    case "uint16":
    case "int32":
    case "uint32":
    case "int64":
    case "uint64":
    case "float":
    case "float32":
    case "float64":
    case "decimal":
    case "decimal128":
    case "string":
    case "url":
      return emitBuiltInType(type);
    case "any":
      return KnownTypes.any;
    case "nullable":
      return getType(context, type.type);
    default:
      throw Error(`Not supported ${type.kind}`);
  }
}

function emitCredential(credential: SdkCredentialType): Record<string, any> {
  let credential_type: Record<string, any> = {};
  const scheme = credential.scheme;
  if (scheme.type === "oauth2") {
    credential_type = {
      type: "OAuth2",
      policy: {
        type: "BearerTokenCredentialPolicy",
        credentialScopes: [],
      },
    };
    for (const flow of scheme.flows) {
      for (const scope of flow.scopes) {
        credential_type.policy.credentialScopes.push(scope.value);
      }
      credential_type.policy.credentialScopes.push();
    }
  } else if (scheme.type === "apiKey") {
    credential_type = {
      type: "Key",
      policy: {
        type: "KeyCredentialPolicy",
        key: scheme.name,
      },
    };
  } else if (scheme.type === "http") {
    credential_type = {
      type: "Key",
      policy: {
        type: "KeyCredentialPolicy",
        key: "Authorization",
        scheme: scheme.scheme[0].toUpperCase() + scheme.scheme.slice(1),
      },
    };
  }
  return getSimpleTypeResult(credential_type);
}

function visibilityMapping(visibility?: Visibility[]): string[] | undefined {
  if (visibility === undefined) {
    return undefined;
  }
  const result = [];
  for (const v of visibility) {
    if (v === Visibility.Read) {
      result.push("read");
    } else if (v === Visibility.Create) {
      result.push("create");
    } else if (v === Visibility.Update) {
      result.push("update");
    } else if (v === Visibility.Delete) {
      result.push("delete");
    } else if (v === Visibility.Query) {
      result.push("query");
    }
  }
  return result;
}

function emitProperty<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  property: SdkBodyModelPropertyType
): Record<string, any> {
  return {
    clientName: camelToSnakeCase(property.name),
    wireName: property.serializedName,
    type: getType(context, property.type),
    optional: property.optional,
    description: property.description,
    addedOn: getAddedOn(context, property),
    visibility: visibilityMapping(property.visibility),
    isDiscriminator: property.discriminator,
    flatten: property.flatten,
    isMultipartFileInput: property.isMultipartFileInput,
  };
}

function emitModel<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: SdkModelType,
  fromBody: boolean
): Record<string, any> {
  if (isEmptyModel(type)) {
    return KnownTypes.any;
  }
  if (typesMap.has(type)) {
    return typesMap.get(type)!;
  }
  const parents: Record<string, any>[] = [];
  const newValue = {
    type: type.kind,
    name: type.name,
    description: type.description,
    parents: parents,
    discriminatorValue: type.discriminatorValue,
    discriminatedSubtypes: {} as Record<string, Record<string, any>>,
    properties: new Array<Record<string, any>>(),
    snakeCaseName: camelToSnakeCase(type.name),
    base: type.isGeneratedName && fromBody ? "json" : "dpg",
    internal: type.access === "internal",
    crossLanguageDefinitionId: type.crossLanguageDefinitionId,
    usage: type.usage,
  };

  typesMap.set(type, newValue);
  newValue.parents = type.baseModel ? [getType(context, type.baseModel)] : newValue.parents;
  for (const property of type.properties.values()) {
    if (property.kind === "property") {
      newValue.properties.push(emitProperty(context, property));
      // type for base discriminator returned by TCGC changes from constant to string while
      // autorest treat all discriminator as constant type, so we need to change to constant type here
      if (type.discriminatedSubtypes && property.discriminator) {
        newValue.properties[newValue.properties.length - 1].isPolymorphic = true;
        if (property.type.kind === "string") {
          newValue.properties[newValue.properties.length - 1].type = getConstantType(null);
        }
      }
    }
  }
  if (type.discriminatedSubtypes) {
    for (const key in type.discriminatedSubtypes) {
      newValue.discriminatedSubtypes[key] = getType(context, type.discriminatedSubtypes[key]);
    }
  }
  return newValue;
}

function emitEnum(type: SdkEnumType): Record<string, any> {
  if (typesMap.has(type)) {
    return typesMap.get(type)!;
  }
  if (type.isGeneratedName) {
    const types = [];
    for (const value of type.values) {
      types.push(
        getSimpleTypeResult({
          type: "constant",
          value: value.value,
          valueType: emitBuiltInType(type.valueType),
        })
      );
    }
    if (!type.isFixed) {
      types.push(emitBuiltInType(type.valueType));
    }
    return {
      description: "",
      internal: true,
      type: "combined",
      types,
      xmlMetadata: {},
    };
  }
  const values: Record<string, any>[] = [];
  const name = type.name;
  const newValue = {
    name: name,
    snakeCaseName: camelToSnakeCase(name),
    description: type.description || `Type of ${name}`,
    internal: type.access === "internal",
    type: type.kind,
    valueType: emitBuiltInType(type.valueType),
    values,
    xmlMetadata: {},
    crossLanguageDefinitionId: type.crossLanguageDefinitionId,
  };
  for (const value of type.values) {
    newValue.values.push(emitEnumMember(value, newValue));
  }
  typesMap.set(type, newValue);
  return newValue;
}

function enumName(name: string): string {
  if (name.toUpperCase() === name) {
    return name;
  }
  return camelToSnakeCase(name).toUpperCase();
}

function emitEnumMember(
  type: SdkEnumValueType,
  enumType: Record<string, any>
): Record<string, any> {
  return {
    name: enumName(type.name),
    value: type.value,
    description: type.description,
    enumType,
    type: type.kind,
    valueType: enumType["valueType"],
  };
}

function emitDurationOrDateType(type: SdkDurationType | SdkDateTimeType): Record<string, any> {
  return getSimpleTypeResult({
    ...emitBuiltInType(type),
    wireType: emitBuiltInType(type.wireType),
  });
}

function emitArrayOrDict<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: SdkArrayType | SdkDictionaryType
): Record<string, any> {
  const kind = type.kind === "array" ? "list" : type.kind;
  return getSimpleTypeResult({
    type: kind,
    elementType: getType(context, type.valueType),
  });
}

function emitConstant(type: SdkConstantType) {
  return getSimpleTypeResult({
    type: type.kind,
    value: type.value,
    valueType: emitBuiltInType(type.valueType),
  });
}

const sdkScalarKindToPythonKind: Record<string, string> = {
  numeric: "integer",
  integer: "integer",
  safeint: "integer",
  int8: "integer",
  uint8: "integer",
  int16: "integer",
  uint16: "integer",
  int32: "integer",
  uint32: "integer",
  int64: "integer",
  uint64: "integer",
  float: "float",
  float32: "float",
  float64: "float",
  decimal: "decimal",
  decimal128: "decimal",
  string: "string",
  password: "string",
  guid: "string",
  url: "string",
  uri: "string",
  uuid: "string",
  etag: "string",
  armId: "string",
  ipAddress: "string",
  azureLocation: "string",
};

function emitBuiltInType(
  type: SdkBuiltInType | SdkDurationType | SdkDateTimeType
): Record<string, any> {
  if (type.kind === "duration" && type.encode === "seconds") {
    return getSimpleTypeResult({
      type: sdkScalarKindToPythonKind[type.wireType.kind],
      encode: type.encode,
    });
  }
  if (type.encode === "unixTimestamp") {
    return getSimpleTypeResult({
      type: "unixtime",
      encode: type.encode,
    });
  }
  return getSimpleTypeResult({
    type: sdkScalarKindToPythonKind[type.kind] || type.kind, // TODO: switch to kind
    encode: type.encode,
  });
}

function emitUnion<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: SdkUnionType
): Record<string, any> {
  return getSimpleTypeResult({
    name: type.isGeneratedName ? undefined : type.name,
    snakeCaseName: type.isGeneratedName ? undefined : camelToSnakeCase(type.name),
    description: type.isGeneratedName ? "" : `Type of ${type.name}`,
    internal: true,
    type: "combined",
    types: type.values.map((x) => getType(context, x)),
    xmlMetadata: {},
  });
}

export function getConstantType(key: string | null): Record<string, any> {
  const cache = simpleTypesMap.get(key);
  if (cache) {
    return cache;
  }
  const type = {
    apiVersions: [],
    type: "constant",
    value: key,
    valueType: KnownTypes.string,
    xmlMetadata: {},
  };
  simpleTypesMap.set(key, type);
  return type;
}

export const KnownTypes = {
  string: { type: "string" },
  anyObject: { type: "any-object" },
  any: { type: "any" },
};

export function emitEndpointType<TServiceOperation extends SdkServiceOperation>(
  context: PythonSdkContext<TServiceOperation>,
  type: SdkEndpointType
): Record<string, any>[] {
  const params: Record<string, any>[] = [];
  for (const param of type.templateArguments) {
    const paramBase = emitParamBase(context, param);
    paramBase.clientName = context.arm ? "base_url" : paramBase.clientName;
    params.push({
      ...paramBase,
      optional: Boolean(param.clientDefaultValue),
      wireName: param.name,
      location: "endpointPath",
      implementation: getImplementation(context, param),
      clientDefaultValue: param.clientDefaultValue,
      skipUrlEncoding: param.urlEncode === false,
    });
    context.__endpointPathParameters!.push(params.at(-1)!);
  }
  return params;
}
