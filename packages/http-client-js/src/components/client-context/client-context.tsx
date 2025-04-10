/**
 * This file defines a ClientContext component. It composes several client-related
 * declarations (context, options, factory) into one coherent source file.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import * as cl from "@typespec/http-client";
import { ClientContextDeclaration } from "./client-context-declaration.jsx";
import { ClientContextFactoryDeclaration } from "./client-context-factory.jsx";
import { ClientContextOptionsDeclaration } from "./client-context-options.jsx";
export interface ClientContextProps {
  /**
   * The HTTP client object that provides configuration details
   */
  client: cl.Client;
  /**
   * Optional nested child elements (not used in this component).
   */
  children?: ay.Children;
}

/**
 * A component that creates a TypeScript source file containing
 * various client context declarations. It composes declarations for the
 * client context itself, its options, and a factory to generate instances.
 *
 * @param props - The properties for configuring the client context.
 * @returns A component encapsulating the client declarations.
 */
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
