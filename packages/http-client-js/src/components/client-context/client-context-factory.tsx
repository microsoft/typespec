import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { HttpAuth, type OAuth2Flow } from "@typespec/http";
import * as cl from "@typespec/http-client";
import { reportDiagnostic } from "../../lib.js";
import { buildClientParameters } from "../../utils/parameters.jsx";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";
import { addClientTestOptions } from "../testing/client-options.jsx";
import { getClientcontextDeclarationRef } from "./client-context-declaration.jsx";
import { ParametrizedEndpoint } from "./parametrized-endpoint.jsx";

export interface ClientContextFactoryProps {
  client: cl.Client;
}

export function getClientContextFactoryRef(client: cl.Client) {
  return ay.refkey(client, "contextFactory");
}

export function ClientContextFactoryDeclaration(props: ClientContextFactoryProps) {
  const ref = getClientContextFactoryRef(props.client);
  const contextDeclarationRef = getClientcontextDeclarationRef(props.client);
  const namePolicy = ts.useTSNamePolicy();
  const factoryFunctionName = namePolicy.getName(`create_${props.client.name}Context`, "function");

  const clientConstructor = $.client.getConstructor(props.client);
  const parameters = buildClientParameters(props.client);
  const urlTemplate = $.client.getUrlTemplate(props.client);
  const endpointRef = ay.refkey();
  const resolvedEndpoint = (
    <ParametrizedEndpoint
      refkey={endpointRef}
      template={urlTemplate.url}
      params={urlTemplate.parameters}
    />
  );

  let credentialsRef: string | undefined;
  if (parameters.some((p) => p.name === "credential")) {
    credentialsRef = "credential";
  }

  // Filter out optional parameters, they will be passed as options
  const args = (
    <ClientFactoryArguments
      client={props.client}
      endpointRef={endpointRef}
      credentialsRef={credentialsRef}
    />
  );

  return (
    <FunctionDeclaration
      export
      name={factoryFunctionName}
      type={clientConstructor}
      returnType={contextDeclarationRef}
      refkey={ref}
      parametersMode="replace"
      parameters={parameters}
    >
      {resolvedEndpoint}
      return <ts.FunctionCallExpression target={httpRuntimeTemplateLib.getClient} args={[args]} />
    </FunctionDeclaration>
  );
}

interface ClientFactoryArgumentsProps {
  client: cl.Client;
  endpointRef: ay.Refkey;
  credentialsRef?: string;
}

function ClientFactoryArguments(props: ClientFactoryArgumentsProps) {
  const params = [<>{props.endpointRef},</>];

  return [
    ...params,
    props.credentialsRef ? (
      <ClientOptionsExpression>
        {props.credentialsRef}
        <AuthSchemeOptions client={props.client} />
      </ClientOptionsExpression>
    ) : (
      <ClientOptionsExpression />
    ),
  ];
}

interface AuthSchemeOptionsProps {
  client: cl.Client;
}

interface AuthSchemeProps {
  scheme: HttpAuth;
  client: cl.Client;
}

function AuthScheme(props: AuthSchemeProps) {
  switch (props.scheme.type) {
    case "http":
      return (
        <ts.ObjectExpression>
          <ay.List comma>
            <ts.ObjectProperty name="kind" jsValue="http" />
            <ts.ObjectProperty name="scheme" jsValue={props.scheme.scheme.toLowerCase()} />
          </ay.List>
        </ts.ObjectExpression>
      );
    case "apiKey":
      if (props.scheme.in !== "header") {
        reportDiagnostic($.program, { code: "non-model-parts", target: props.client.service });
        return null;
      }

      return (
        <ts.ObjectExpression>
          <ay.List comma>
            <ts.ObjectProperty name="kind" jsValue="apiKey" />
            <ts.ObjectProperty name="apiKeyLocation" jsValue={props.scheme.in} />
            <ts.ObjectProperty name="name" jsValue={props.scheme.name} />
          </ay.List>
        </ts.ObjectExpression>
      );
    case "oauth2":
      return (
        <ts.ObjectExpression>
          <ay.List comma>
            <ts.ObjectProperty name="kind" jsValue="oauth2" />
            <ts.ObjectProperty name="flows">
              [
              <ay.For each={props.scheme.flows} comma line>
                {(flow) => <OAuth2Flow flow={flow} />}
              </ay.For>
              ]
            </ts.ObjectProperty>
          </ay.List>
        </ts.ObjectExpression>
      );
    default:
      return null;
  }
}

interface OAuth2FlowProps {
  flow: OAuth2Flow;
}

function OAuth2Flow(props: OAuth2FlowProps) {
  // rename type to kind and clean up the scopes
  const { type, ...rewrittenFlow } = {
    kind: props.flow.type,
    ...props.flow,
    // scopes are sometimes duplicated so converting to set and back to dedupe
    scopes: [...new Set(props.flow.scopes.map((s) => s.value))],
  };

  return <ts.ObjectExpression jsValue={rewrittenFlow} />;
}

function AuthSchemeOptions(props: AuthSchemeOptionsProps) {
  const clientCredential = $.client.getAuth(props.client);

  if (clientCredential.schemes.length === 0) {
    return null;
  }

  // Filtering out custom http schemes for "http/custom" spector scenario
  // TODO: Should typekit allow for arbitrary strings on scheme with http auth type?
  const supportedSchemes = clientCredential.schemes.filter(
    (s) => s.type !== "http" || ["Basic", "Bearer"].includes(s.scheme),
  );

  return (
    <ts.ObjectProperty name="authSchemes">
      [
      <ay.For each={supportedSchemes} comma line>
        {(scheme) => <AuthScheme scheme={scheme} client={props.client} />}
      </ay.For>
      ]
    </ts.ObjectProperty>
  );
}

interface ClientOptionsExpressionProps {
  children?: ay.Children;
}

function ClientOptionsExpression(props: ClientOptionsExpressionProps) {
  const options: ay.Children = ["...options"];

  // Conditionally add test options
  // based on the environment variable TYPESPEC_JS_EMITTER_TESTING
  addClientTestOptions(options);

  const children = Array.isArray(props.children) ? props.children : [props.children];
  if (children.length) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    options.push(...children);
  }

  return (
    <ts.ObjectExpression>
      <ay.For each={options} joiner="," line>
        {(child) => child}
      </ay.For>
    </ts.ObjectExpression>
  );
}
