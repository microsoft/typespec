import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty, Value } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { buildParameterDescriptor } from "@typespec/emitter-framework/typescript";
import { HttpAuth, HttpProperty } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { getClientContextOptionsRef } from "../components/client-context/client-context-options.jsx";
import { httpRuntimeTemplateLib } from "../components/external-packages/ts-http-runtime.js";

export function buildClientParameters(client: cl.Client): Record<string, ts.ParameterDescriptor> {
  const clientConstructor = $.client.getConstructor(client);
  const parameters = $.operation.getClientSignature(client, clientConstructor);
  const params = parameters.reduce(
    (acc, param) => {
      const paramsDescriptor = buildClientParameterDescriptor(param);
      if (!paramsDescriptor) {
        return acc;
      }
      const [name, descriptor] = paramsDescriptor;

      if (!descriptor.optional) {
        acc[name] = descriptor;
      }

      return acc;
    },
    {} as Record<string, ts.ParameterDescriptor>,
  );

  if (!params["options"]) {
    params["options"] = {
      refkey: ay.refkey(),
      optional: true,
      type: getClientContextOptionsRef(client),
    };
  }

  return params;
}

function buildClientParameterDescriptor(
  modelProperty: ModelProperty,
): [string, ts.ParameterDescriptor] | undefined {
  const authSchemes = $.modelProperty.getCredentialAuth(modelProperty);

  if (authSchemes) {
    if (authSchemes.length === 1 && authSchemes[0].type === "noAuth") {
      return undefined;
    }

    const credentialType = Array.from(
      new Set(authSchemes.filter((s) => s.type !== "noAuth").map((s) => getCredentialType(s))),
    );
    return [
      "credential",
      {
        refkey: ay.refkey(modelProperty),
        optional: modelProperty.optional,
        type: ay.mapJoin(credentialType, (t) => t, { joiner: " | " }),
      },
    ];
  }

  return buildParameterDescriptor(modelProperty);
}

function getCredentialType(scheme: HttpAuth) {
  switch (scheme.type) {
    case "apiKey":
    case "http":
      return httpRuntimeTemplateLib.KeyCredential;
    case "oauth2":
      return httpRuntimeTemplateLib.TokenCredential;
    default:
      return null;
  }
}

/**
 * Checks if a parameter has a default value. Only honors default values for content-type.
 * @param property Property to check
 * @returns whether the property has a default value
 */
export function hasDefaultValue(property: HttpProperty): boolean {
  return getDefaultValue(property) !== undefined;
}

export function getDefaultValue(property: ModelProperty): string | number | boolean | undefined;
export function getDefaultValue(property: HttpProperty): string | number | boolean | undefined;
export function getDefaultValue(
  httpOrModelProperty: HttpProperty | ModelProperty,
): string | number | boolean | undefined {
  let property;

  if ("kind" in httpOrModelProperty && httpOrModelProperty.kind === "ModelProperty") {
    property = httpOrModelProperty;
  } else {
    property = httpOrModelProperty.property;
  }

  if (property.defaultValue) {
    if ("value" in property.defaultValue) {
      return getValue(property.defaultValue);
    }
  }

  if ("value" in property.type && property.type.value !== undefined) {
    return JSON.stringify(property.type.value);
  }

  return undefined;
}

function getValue(value: Value | undefined) {
  if (!value) {
    return undefined;
  }
  switch (value.valueKind) {
    case "StringValue":
      return `"${value.value}"`;
    case "NumericValue":
      return value.value.asNumber() ?? undefined;
    case "BooleanValue":
      return value.value;
    default:
      return undefined;
  }
}
