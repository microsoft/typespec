import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { $ } from "@typespec/compiler/experimental/typekit";
import * as cl from "@typespec/http-client-library";

export interface ClientDirectoryProps {
  client: cl.Client;
  children?: ay.Children;
}

export function ClientDirectory(props: ClientDirectoryProps) {
  // If it is the root client, we don't need to create a directory
  if (!$.client.getParent(props.client)) {
    return props.children;
  }

  const namePolicy = ts.useTSNamePolicy();
  const clientName = namePolicy.getName(props.client.name, "variable");

  return <ay.SourceDirectory path={clientName}>
    <ts.BarrelFile export={clientName} />
    {props.children}
  </ay.SourceDirectory>;
}
