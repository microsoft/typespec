import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client";
import { ClientContextDeclaration } from "./client-context-declaration.jsx";
import { ClientContextFactoryDeclaration } from "./client-context-factory.jsx";
import { ClientContextOptionsDeclaration } from "./client-context-options.jsx";

export interface ClientContextProps {
  client: cl.Client;
  children?: ay.Children;
}

export function ClientContext(props: ClientContextProps) {
  const namePolicy = ts.useTSNamePolicy();
  const fileName = namePolicy.getName(props.client.name + "Context", "variable");
  return (
    <ts.SourceFile path={`${fileName}.ts`}>
      <ClientContextDeclaration client={props.client} />
      <ClientContextOptionsDeclaration client={props.client} />
      <ClientContextFactoryDeclaration client={props.client} />
    </ts.SourceFile>
  );
}
