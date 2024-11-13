import { Children } from "@alloy-js/core";
import { listServices, Namespace } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClientLibraryContext } from "../context/client-library-context.js";
export interface ClientLibraryProps {
  scope: string;
  children?: Children;
}

export function ClientLibrary(props: ClientLibraryProps) {
  const service = listServices($.program);
  let rootNs: Namespace;
  if (service.length === 0) {
    rootNs = $.program.getGlobalNamespaceType();
  } else {
    rootNs = service[0].type;
  }
  return (
    <ClientLibraryContext.Provider value={{ scope: props.scope, rootNs }}>
      {props.children}
    </ClientLibraryContext.Provider>
  );
}
