import * as ay from "@alloy-js/core";
import { code } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import * as cl from "@typespec/http-client-library";
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

  const args = Object.keys(parameters).join(", ");

  return <FunctionDeclaration
  export
  name={factoryFunctionName}
  type={clientConstructor}
  returnType={contextDeclarationRef}
  refkey={ref}
  parametersMode="replace"
  parameters={parameters}
>
  return {httpRuntimeTemplateLib.getClient}({args}, {code`{allowInsecureConnection: true}`});
</FunctionDeclaration>;
}
