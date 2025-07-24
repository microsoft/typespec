import { Refkey, refkey } from "@alloy-js/core";
import { ModelProperty, Operation, StringLiteral, Type } from "@typespec/compiler";
import { type Typekit } from "@typespec/compiler/typekit";
import { getHttpService, resolveAuthentication } from "@typespec/http";
import { _InternalClient } from "../interfaces.js";
import { authSchemeSymbol, credentialSymbol } from "../types/credential-symbol.js";
import { getStringValue, getUniqueTypes } from "./helpers.js";

const credentialCache = new Map<Refkey, ModelProperty>();
export function getCredentialParameter(
  $: Typekit,
  client: _InternalClient,
): ModelProperty | undefined {
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

export function getConstructors($: Typekit, client: _InternalClient): Operation[] {
  const constructors: Operation[] = [];
  const params: ModelProperty[] = [];
  const servers = $.client.listServers(client);

  if (servers === undefined) {
    // If there are no servers, then we have a single constructor with a single parameter, "endpoint".
    // This is the default behavior when there are no servers defined.
    const endpointParam = $.modelProperty.create({
      name: "endpoint",
      type: $.builtin.string,
      optional: false,
    });

    params.push(endpointParam);
  } else {
    // build the endpoint parameter
    const serverDefaultUrls: { url: string; params?: Map<string, ModelProperty> }[] = [];

    for (const server of servers) {
      if (server.url) {
        serverDefaultUrls.push({ url: server.url, params: server.parameters });
      }
    }

    if (serverDefaultUrls.length === 1) {
      for (const param of serverDefaultUrls[0].params?.values() ?? []) {
        params.push(param);
      }

      const internalEndpointName = params.some((param) => param.name === "endpoint")
        ? "_endpoint"
        : "endpoint";
      const endpointParam = $.modelProperty.create({
        name: internalEndpointName,
        type: $.builtin.string,
        optional: false,
        defaultValue: getStringValue($, serverDefaultUrls[0].url),
      });
      params.push(endpointParam);
    } else {
      const endpointVariants = serverDefaultUrls.map((value) =>
        $.unionVariant.create({
          type: $.literal.createString(value.url),
        }),
      );
      endpointVariants.push($.unionVariant.create({ type: $.builtin.string }));
      const endpointUnionType = $.union.create({ variants: endpointVariants });

      // If we have multiple default values, we can't chose a single one so we make the type a union of the literals and string
      const endpointParam = $.modelProperty.create({
        name: "endpoint",
        type: endpointUnionType,
        optional: false,
      });

      params.push(endpointParam);
    }
  }

  const credParam = getCredentialParameter($, client);
  if (credParam) {
    params.push(credParam);
  }

  constructors.push(
    $.operation.create({
      name: "constructor",
      parameters: params,
      returnType: $.intrinsic.void,
    }),
  );

  return constructors;
}

export function createBaseConstructor(
  $: Typekit,
  client: _InternalClient,
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
    const uniqueTypes = getUniqueTypes(
      $,
      params.map((param) => param.type),
    );
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
    returnType: $.intrinsic.void,
  });
}
