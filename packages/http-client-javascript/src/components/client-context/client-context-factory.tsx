import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
import { reportDiagnostic } from "../../lib.js";
import { buildClientParameters } from "../../utils/parameters.jsx";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";
import { getClientcontextDeclarationRef } from "./client-context-declaration.jsx";

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

  // Filter out optional parameters, they will be passed as options
  const args = <ClientFactoryArguments client={props.client} />;

  return <FunctionDeclaration
  export
  name={factoryFunctionName}
  type={clientConstructor}
  returnType={contextDeclarationRef}
  refkey={ref}
  parametersMode="replace"
  parameters={parameters}
>
  return <ts.FunctionCallExpression refkey={httpRuntimeTemplateLib.getClient} args={[args]} />
</FunctionDeclaration>;
}

interface ClientFactoryArgumentsProps {
  client: cl.Client;
}

function ClientFactoryArguments(props: ClientFactoryArgumentsProps) {
  const parameters = buildClientParameters(props.client);

  // Get positional arguments
  const positionalArguments: ay.Children = Object.entries(parameters)
    .filter(([n, p]) => !p.optional)
    .map(([name]) => name);

  return <>
    {ay.mapJoin(positionalArguments, (arg) => arg, { joiner: ", " , ender: ", " })}
    <ClientOptionsExpression>
      <CredentialOptions client={props.client} />
    </ClientOptionsExpression>
  </>;
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
      return <ts.ObjectProperty name="credentials">
        <ts.ObjectExpression>
          <ts.ObjectProperty name="apiKeyHeaderName" jsValue={"Authorization"} />
        </ts.ObjectExpression>
      </ts.ObjectProperty>;
    case "apiKey":
      if (scheme.in !== "header") {
        reportDiagnostic($.program, { code: "non-model-parts", target: props.client.service });
        return null;
      }

      return <ts.ObjectProperty name="credentials">
        <ts.ObjectExpression>
          <ts.ObjectProperty name="apiKeyHeaderName" jsValue={scheme.name} />
        </ts.ObjectExpression>
      </ts.ObjectProperty>;
    default:
      return null;
  }
}

interface ClientOptionsExpressionProps {
  children?: ay.Children;
}

function ClientOptionsExpression(props: ClientOptionsExpressionProps) {
  const options: ay.Children = ["...options"];

  const children = Array.isArray(props.children) ? props.children : [props.children];
  if (children.length) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    options.push(...children);
  }

  return <ts.ObjectExpression>
    {ay.mapJoin(options, (child) => child, { joiner: ", " })}
  </ts.ObjectExpression>;
}
