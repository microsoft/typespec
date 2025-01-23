import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client-library";
import { ClientContextDeclaration } from "./client-context-declaration.jsx";
import { ClientContextFactoryDeclaration } from "./client-context-factory.jsx";
import { ClientContextOptionsDeclaration } from "./client-context-options.jsx";

export interface ClientContextProps {
  client: cl.Client;
  children?: ay.Children;
}

export function ClientContext(props: ClientContextProps) {
  return <ts.SourceFile path="clientContext.ts">
     <ClientContextDeclaration client={props.client} />
      <ClientContextOptionsDeclaration client={props.client} />
      <ClientContextFactoryDeclaration client={props.client} />
  </ts.SourceFile>;
}
