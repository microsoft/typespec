import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client-library";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

export interface ClientContextDeclarationProps {
  client: cl.Client;
}

export function getClientcontextDeclarationRef(client: cl.Client) {
  const refkey = ay.refkey(client, "declaration");
  return {
    key: refkey,
    component: <ts.Reference refkey={refkey} />,
  };
}

export function ClientContextDeclaration(props: ClientContextDeclarationProps) {
  const ref = getClientcontextDeclarationRef(props.client);
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${props.client.name}Context`, "class");
  return <ts.InterfaceDeclaration export name={name} refkey={ref.key} extends={httpRuntimeTemplateLib.Client} />;
}
