import { Children } from "@alloy-js/core";
import { listServices } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { ClientLibraryContext } from "../context/client-library-context.js";
export interface ClientLibraryProps {
  scope: string;
  children?: Children;
}

export function ClientLibrary(props: ClientLibraryProps) {
  const service = listServices($.program);
  if (service.length === 0) {
    throw new Error("No services found");
  }
  return (
    <ClientLibraryContext.Provider value={{ scope: props.scope, rootNs: service[0].type }}>
      {props.children}
    </ClientLibraryContext.Provider>
  );
}
