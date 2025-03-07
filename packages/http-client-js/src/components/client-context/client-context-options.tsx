import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

export interface ClientContextOptionsDeclarationProps {
  client: cl.Client;
}

export function getClientContextOptionsRef(client: cl.Client) {
  return ay.refkey(client, "options");
}

export function ClientContextOptionsDeclaration(props: ClientContextOptionsDeclarationProps) {
  const ref = getClientContextOptionsRef(props.client);
  const namePolicy = ts.useTSNamePolicy();
  const name = namePolicy.getName(`${props.client.name}Options`, "interface");

  // TODO: Here we will calculate and include all the options that the client can accept
  const clientOptions: Map<string, ay.Children> = new Map();

  return <ts.InterfaceDeclaration export name={name} refkey={ref} extends={<ts.Reference refkey={httpRuntimeTemplateLib.ClientOptions}/>}>
        {ay.mapJoin(clientOptions, (key, value) => (
          <ts.InterfaceMember optional name={key} type={value} />
        ), { joiner: ";\n" })}
        <ts.InterfaceMember optional name="endpoint" type="string" />
      </ts.InterfaceDeclaration>;
}
