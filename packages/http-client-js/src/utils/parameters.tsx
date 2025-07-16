import { code, mapJoin, Refkey, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty, Value } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { TypeExpression } from "@typespec/emitter-framework/typescript";
import { HttpAuth, HttpProperty, OAuth2FlowType } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { getClientContextOptionsRef } from "../components/client-context/client-context-options.jsx";
import { httpRuntimeTemplateLib } from "../components/external-packages/ts-http-runtime.js";

export function buildClientParameters(
  client: cl.Client,
  suffixRefkey: Refkey,
): ts.ParameterDescriptor[] {
  const { $ } = useTsp();
  const initialization = $.client.getInitialization(client);

  if (!initialization) {
    return [];
  }

  // We will build the constructor parameters in the following order:
  // 1. Endpoint parameters
  // 2. Credential parameters
  // 3. Client initialization parameters
  //    (endpoint template params, hoisted params from operations, etc.)
  // 4. Client options

  // TODO: Handle multiple endpoints
  const endpointParameters: ts.ParameterDescriptor[] = [
    ...initialization.endpoints[0].parameters.entries(),
  ].map(([name, p]) => ({
    name,
    type: <TypeExpression type={p.type} />,
    optional: p.defaultValue ? true : p.optional,
    refkey: refkey(p.type, suffixRefkey, name),
  }));

  const endpointParam = endpointParameters.find((p) => p.name === "endpoint");
  const templateParams = endpointParameters.filter((p) => p.name !== "endpoint");
  const credentialParameter = buildClientCredentialParameter(client);
  const optionsParam: ts.ParameterDescriptor = {
    name: "options",
    optional: true,
    type: getClientContextOptionsRef(client),
    refkey: refkey(),
  };

  const clientConstructorParams: ts.ParameterDescriptor[] = [];

  if (endpointParam && !endpointParam.optional) {
    clientConstructorParams.push(endpointParam);
  }

  if (credentialParameter) {
    clientConstructorParams.push(credentialParameter);
  }

  if (templateParams.length > 0) {
    clientConstructorParams.push(...templateParams);
  }

  clientConstructorParams.push(optionsParam);

  return clientConstructorParams;
}

function buildClientCredentialParameter(client: cl.Client): ts.ParameterDescriptor | undefined {
  const { $ } = useTsp();

  const initialization = $.client.getInitialization(client);
  if (!initialization) {
    return undefined;
  }

  if (!initialization.authentication?.options.length) {
    return undefined;
  }

  if (
    initialization.authentication.options?.some((authScheme) =>
      authScheme.schemes.some((s) => s.type === "noAuth"),
    )
  ) {
    // If noAuth is used, we need to handle it specially
    return undefined;
  }

  // TODO: Need to handle multiple authentication schemes
  const credentialDescriptor: ts.ParameterDescriptor = {
    name: "credential",
    type: mapJoin(
      () => initialization.authentication!.options,
      (authScheme) => {
        return getCredentialType(authScheme.schemes[0]);
      },
      { joiner: " | " },
    ),
    refkey: refkey(),
  };

  return credentialDescriptor;
}

const oauth2FlowRefs: Record<OAuth2FlowType, Refkey> = {
  authorizationCode: httpRuntimeTemplateLib.AuthorizationCodeFlow,
  clientCredentials: httpRuntimeTemplateLib.ClientCredentialsFlow,
  password: httpRuntimeTemplateLib.PasswordFlow,
  implicit: httpRuntimeTemplateLib.ImplicitFlow,
};

function getCredentialType(scheme: HttpAuth) {
  switch (scheme.type) {
    case "apiKey":
      return httpRuntimeTemplateLib.ApiKeyCredential;
    case "http":
      if (scheme.scheme === "Basic") {
        return httpRuntimeTemplateLib.BasicCredential;
      } else {
        return httpRuntimeTemplateLib.BearerTokenCredential;
      }
    case "oauth2":
      const flowType = mapJoin(
        () => scheme.flows,
        (x) => oauth2FlowRefs[x.type],
        { joiner: " | " },
      );
      return code`${httpRuntimeTemplateLib.OAuth2TokenCredential}<${flowType}>`;
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
