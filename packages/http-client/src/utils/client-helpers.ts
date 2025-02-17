import { Refkey, refkey } from "@alloy-js/core";
import { ModelProperty, Operation, StringLiteral, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { getHttpService, resolveAuthentication } from "@typespec/http";
import { InternalClient } from "../interfaces.js";
import { authSchemeSymbol, credentialSymbol } from "../types/credential-symbol.js";
import { getStringValue, getUniqueTypes } from "./helpers.js";

/**
 * Returns endpoint parameters, grouped by constructor. Meaning, each constructor will have its own set of parameters.
 * @param client
 * @returns
 */
export function getEndpointParametersPerConstructor(client: InternalClient): ModelProperty[][] {
  const servers = $.client.listServers(client);
  /**
   * If there are no servers, then we have a single constructor with a single parameter, "endpoint".
   * This is the default behavior when there are no servers defined.
   */
  if (servers === undefined) {
    const name = "endpoint";
    return [
      [
        $.modelProperty.create({
          name,
          type: $.program.checker.getStdType("string"),
          optional: false,
          defaultValue: getStringValue("{endpoint}"),
        }),
      ],
    ];
  }
  const retval: ModelProperty[][] = [];
  for (const server of servers) {
    const overridingEndpointConstructor: ModelProperty[] = [];
    // add a parameter for each server, this is where users can override and pass in the full server
    // If there is a default url, then endpoint should be optional
    const isEndpointOptional = server.url !== undefined && server.parameters.size === 0;

    if (isEndpointOptional) {
      overridingEndpointConstructor.push(
        $.modelProperty.create({
          name: "endpoint",
          type: $.builtin.string,
          optional: isEndpointOptional,
          defaultValue: getStringValue(server.url),
        }),
      );
      retval.push(overridingEndpointConstructor);
    }

    const formattingServerUrlConstructor: ModelProperty[] = [];
    for (const param of server.parameters.values()) {
      formattingServerUrlConstructor.push(
        $.modelProperty.create({
          name: param.name,
          type: param.type,
          optional: param.optional,
          defaultValue: param.defaultValue,
        }),
      );
    }
    if (formattingServerUrlConstructor.length > 0) {
      retval.push(formattingServerUrlConstructor);
    }
  }
  return retval;
}

const credentialCache = new Map<Refkey, ModelProperty>();
export function getCredentalParameter(client: InternalClient): ModelProperty | undefined {
  const [httpService] = getHttpService($.program, client.service);

  const schemes = resolveAuthentication(httpService).schemes;
  if (!schemes.length) return;
  const credTypes: StringLiteral[] = schemes.map((scheme) => {
    const schemeLiteral = $.literal.createString(scheme.type);
    schemeLiteral[authSchemeSymbol] = scheme;
    return schemeLiteral;
  });

  const cacheKey = getCredRefkey(credTypes);

  if (credentialCache.has(cacheKey)) {
    return credentialCache.get(cacheKey)!;
  }

  let credType: Type;
  if (credTypes.length === 1) {
    credType = credTypes[0];
  } else {
    const variants = credTypes.map((v) => $.unionVariant.create({ name: v.value, type: v }));
    credType = $.union.create({ variants });
  }
  const credentialParameter = $.modelProperty.create({
    name: "credential",
    type: credType,
  });

  credentialParameter[credentialSymbol] = true;

  credentialCache.set(cacheKey, credentialParameter);

  return credentialParameter;
}

function getCredRefkey(credentials: StringLiteral[]): Refkey {
  return refkey(credentials.map((c) => c.value).join());
}

export function getConstructors(client: InternalClient): Operation[] {
  const constructors: Operation[] = [];
  let params: ModelProperty[] = [];
  const credParam = getCredentalParameter(client);
  if (credParam) {
    params.push(credParam);
  }
  const endpointParams = getEndpointParametersPerConstructor(client);
  if (endpointParams.length === 1) {
    // this means we have a single constructor
    params = [...endpointParams[0], ...params];
    constructors.push(
      $.operation.create({
        name: "constructor",
        parameters: params,
        returnType: $.program.checker.voidType,
      }),
    );
  } else {
    // this means we have one constructor with overloads, one for each group of endpoint parameter
    for (const endpointParamGrouping of endpointParams) {
      constructors.push(
        $.operation.create({
          name: "constructor",
          parameters: [...endpointParamGrouping, ...params],
          returnType: $.program.checker.voidType,
        }),
      );
    }
  }

  return constructors;
}

export function createBaseConstructor(
  client: InternalClient,
  constructors: Operation[],
): Operation {
  const allParams: Map<string, ModelProperty[]> = new Map();
  const combinedParams: ModelProperty[] = [];

  // Collect all parameters from all constructors
  constructors.forEach((constructor) => {
    constructor.parameters.properties.forEach((param) => {
      if (!allParams.has(param.name)) {
        allParams.set(param.name, []);
      }
      allParams.get(param.name)!.push(param);
    });
  });

  // Combine parameter types and determine if they should be optional
  allParams.forEach((params, name) => {
    // if they aren't used in every single overload, then the parameter should be optional
    // otherwise, it's optional if any of the overloads have it as optional
    const overrideToOptional = params.length !== constructors.length;
    const uniqueTypes = getUniqueTypes(params.map((param) => param.type));
    const combinedType =
      uniqueTypes.length > 1
        ? $.union.create({ variants: uniqueTypes.map((x) => $.unionVariant.create({ type: x })) })
        : uniqueTypes[0];
    combinedParams.push(
      $.modelProperty.create({
        name,
        type: combinedType,
        optional: overrideToOptional ? true : params.some((param) => param.optional),
      }),
    );
  });
  // Custom sorting function
  combinedParams.sort((a, b) => {
    // Required parameters come before optional ones
    if (a.optional !== b.optional) {
      return a.optional ? 1 : -1;
    }

    // "endpoint" comes before "credential"
    if (a.name === "endpoint" && b.name !== "endpoint") {
      return -1;
    }
    if (a.name !== "endpoint" && b.name === "endpoint") {
      return 1;
    }
    if (a.name === "credential" && b.name !== "credential") {
      return -1;
    }
    if (a.name !== "credential" && b.name === "credential") {
      return 1;
    }

    // Alphabetical ordering
    return a.name.localeCompare(b.name);
  });
  return $.operation.create({
    name: "constructor",
    parameters: combinedParams,
    returnType: $.program.checker.voidType,
  });
}
