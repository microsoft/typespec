import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
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
  if (clientConstructor.parameters.properties.has("credential")) {
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

  if (props.credentialsRef) {
    params.push(<>{props.credentialsRef},</>);
  }

  return [
    ...params,
    <ClientOptionsExpression>
      <CredentialOptions client={props.client} />
    </ClientOptionsExpression>,
  ];
}

interface CredentialOptionsProps {
  client: cl.Client;
}

function CredentialOptions(props: CredentialOptionsProps) {
  const clientCredential = $.client.getAuth(props.client);

  if (clientCredential.schemes.length === 0) {
    return null;
  }

  if (clientCredential.schemes.length !== 1) {
    reportDiagnostic($.program, {
      code: "multiple-auth-schemes-not-yet-supported",
      target: props.client.type,
    });
  }

  const scheme = clientCredential.schemes[0];

  switch (scheme.type) {
    case "http":
      // Todo: handle scopes?
      return (
        <ts.ObjectProperty name="credentials">
          <ts.ObjectExpression>
            <ts.ObjectProperty name="apiKeyHeaderName" jsValue={"Authorization"} />
          </ts.ObjectExpression>
        </ts.ObjectProperty>
      );
    case "apiKey":
      if (scheme.in !== "header") {
        reportDiagnostic($.program, { code: "non-model-parts", target: props.client.service });
        return null;
      }

      return (
        <ts.ObjectProperty name="credentials">
          <ts.ObjectExpression>
            <ts.ObjectProperty name="apiKeyHeaderName" jsValue={scheme.name} />
          </ts.ObjectExpression>
        </ts.ObjectProperty>
      );
    default:
      return null;
  }
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
