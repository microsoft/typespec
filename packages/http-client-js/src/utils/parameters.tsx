import type { Refkey } from "@alloy-js/core";
import { code, mapJoin, refkey } from "@alloy-js/core";
import type * as ts from "@alloy-js/typescript";
import type { ModelProperty, Value } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { buildParameterDescriptor } from "@typespec/emitter-framework/typescript";
import type {
  AuthenticationReference,
  HttpAuth,
  HttpProperty,
  OAuth2FlowType,
} from "@typespec/http";
import type * as cl from "@typespec/http-client";
import { getClientContextOptionsRef } from "../components/client-context/client-context-options.jsx";
import { httpRuntimeTemplateLib } from "../components/external-packages/ts-http-runtime.js";

export function buildClientParameters(
  client: cl.Client,
  suffixRefkey: Refkey,
): ts.ParameterDescriptor[] {
  const { $ } = useTsp();
  const clientConstructor = $.client.getConstructor(client);
  const parameters = $.operation.getClientSignature(client, clientConstructor);
  const descriptors = parameters.flatMap((param) => {
    const descriptor = buildClientParameterDescriptor(client, param, suffixRefkey);
    return descriptor ? [descriptor] : [];
  });

  // Optional parameters are passed through the options bag, except for the credential, which stays
  // positional. It goes after the required parameters so the signature remains valid.
  const params = descriptors.filter((d) => !d.optional);
  params.push(...descriptors.filter((d) => d.optional && d.name === "credential"));

  if (!params.some((p) => p.name === "options")) {
    params.push({
      name: "options",
      refkey: refkey("client-options", suffixRefkey),
      optional: true,
      type: getClientContextOptionsRef(client),
    });
  }

  return params;
}

function buildClientParameterDescriptor(
  client: cl.Client,
  modelProperty: ModelProperty,
  suffixRefkey: Refkey,
): ts.ParameterDescriptor | undefined {
  const { $ } = useTsp();
  const authSchemes = $.modelProperty.getCredentialAuth(modelProperty);

  if (authSchemes) {
    if (authSchemes.length === 1 && authSchemes[0].type === "noAuth") {
      return undefined;
    }

    const allowsAnonymous = clientAllowsAnonymousAccess(client, authSchemes);
    const credentialType = Array.from(
      new Set(authSchemes.filter((s) => s.type !== "noAuth").map((s) => getCredentialType(s))),
    );
    return {
      name: "credential",
      refkey: refkey(modelProperty, suffixRefkey),
      optional: modelProperty.optional || allowsAnonymous,
      type: mapJoin(
        () => credentialType,
        (t) => t,
        { joiner: " | " },
      ),
    };
  }

  return buildParameterDescriptor(modelProperty, suffixRefkey);
}

/**
 * Whether every operation of the client can be called without credentials, i.e. `NoAuth` is one of
 * the alternatives in the auth union that applies to each of them. The credential schemes are
 * collected service-wide, so a `noAuth` scheme alone is not enough: an operation in a nested
 * namespace using `@useAuth(NoAuth)` must not make the credential optional for the other operations.
 */
function clientAllowsAnonymousAccess(client: cl.Client, authSchemes: HttpAuth[]): boolean {
  const { $ } = useTsp();
  if (!authSchemes.some((s) => s.type === "noAuth")) {
    return false;
  }

  const auth = $.client.getAuth(client);
  return [auth.defaultAuth, ...auth.operationsAuth.values()].every(allowsAnonymousAccess);
}

function allowsAnonymousAccess(reference: AuthenticationReference): boolean {
  return (
    reference.options.length === 0 ||
    reference.options.some((option) => option.all.every((ref) => ref.kind === "noAuth"))
  );
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
