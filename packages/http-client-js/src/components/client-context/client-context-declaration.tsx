/**
 * This file defines component that generates a declaration of a client context interface.
 * The generated interface extends from a HTTP runtime client interface defined in httpRuntimeTemplateLib.
 *
 * The main exports are:
 * - ClientContextDeclaration: A JSX component that outputs a TypeScript interface declaration.
 * - getClientcontextDeclarationRef: A helper function to generate a unique reference key for the client context interface declaration.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client";
import { httpRuntimeTemplateLib } from "../external-packages/ts-http-runtime.js";

/**
 * Define the properties accepted by the ClientContextDeclaration component
 */
export interface ClientContextDeclarationProps {
  client: cl.Client;
}

/**
 * Generates a unique reference key for the client context declaration.
 *
 * @param client - The client object for which the reference key is generated.
 * @returns A unique reference key string associated with the client's context interface declaration.
 */
export function getClientcontextDeclarationRef(client: cl.Client) {
  return ay.refkey(client, "declaration");
}

/**
 * A  component that generates a TypeScript interface declaration for a client context.
 *
 * The interface is named using the client name appended with "Context" and is exported.
 * It also inherits from the HTTP runtime client interface provided by httpRuntimeTemplateLib.
 *
 * @returns A component that generates the client context interface.
 */
export function ClientContextDeclaration(props: ClientContextDeclarationProps) {
  // Generate a unique reference for the client's declaration context
  const ref = getClientcontextDeclarationRef(props.client);

  // Get the name policy utility to generate a proper TypeScript name for the context interface
  const namePolicy = ts.useTSNamePolicy();

  // Generate the interface name by appending "Context" to the client's name and ensuring it's a valid class name
  const name = namePolicy.getName(`${props.client.name}Context`, "class");

  // Return a TypeScript interface declaration element, setting it to export and extend the HTTP runtime client interface
  return (
    <ts.InterfaceDeclaration
      export
      name={name}
      refkey={ref}
      extends={httpRuntimeTemplateLib.Client}
    />
  );
}
