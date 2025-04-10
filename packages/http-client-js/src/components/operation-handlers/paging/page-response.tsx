/**
 * This file defines the PageResponseDeclaration component which builds a TypeScript interface
 * for paginated API responses based on the provided paging operation. It also defines a helper
 * function to generate a unique reference key for the page response type.
 */

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { PagingOperation, PagingProperty } from "@typespec/compiler";
import * as ef from "@typespec/emitter-framework/typescript";
import { HttpOperation } from "@typespec/http";

/**
 * Props for the PageResponseDeclaration component.
 */
export interface PageResponseProps {
  operation: HttpOperation; // The HTTP operation for which the page response is defined.
  pagingOperation: PagingOperation; // The paging operation containing the output definitions.
}

/**
 * Generates a unique reference key for the page response type associated with the given operation.
 *
 * @param operation - The HTTP operation for which to generate the reference key.
 * @returns A unique reference identifier for the page response.
 */
export function getPageResponseTypeRefkey(operation: HttpOperation) {
  return ay.refkey(operation, "page-response");
}

/**
 * Constructs a TypeScript interface declaration for the paged response structure.
 * It filters and includes only the accepted paging properties from the paging operation output.
 *
 * @param props - The properties containing the HTTP operation and paging operation details.
 * @returns A JSX element representing the interface declaration for the page response.
 */
export function PageResponseDeclaration(props: PageResponseProps) {
  // Retrieve the naming policy and generate an interface name based on the operation's name.
  const namePolicy = ts.useTSNamePolicy();
  const interfaceName = namePolicy.getName(
    props.operation.operation.name + "PageResponse",
    "interface",
  );

  // Extract the output definitions containing paging properties from the paging operation.
  const definedResponses = props.pagingOperation.output;

  // List of accepted paging property names; only these properties will be included.
  const acceptedColumns = [
    "continuationToken",
    "pageItems",
    "nextLink",
    "prevLink",
    "firstLink",
    "lastLink",
  ];

  // Array to hold validated paging properties extracted from the defined responses.
  const responseProperties: PagingProperty[] = [];

  // Loop through each key in the output definitions and include only accepted properties.
  for (const key in definedResponses) {
    // Retrieve the current paging property.
    const property = definedResponses[key as keyof typeof definedResponses];
    // If the property is one of the accepted columns and is truthy, add it to the responseProperties.
    if (acceptedColumns.includes(key) && !!property) {
      responseProperties.push(property);
    }
  }

  return (
    <ts.InterfaceDeclaration
      export
      name={interfaceName}
      refkey={getPageResponseTypeRefkey(props.operation)}
    >
      <ay.For each={responseProperties} line>
        {(parameter) => (
          <ts.InterfaceMember
            name={parameter.property.name}
            optional={parameter.property.optional}
            type={<ef.TypeExpression type={parameter.property.type} />}
          />
        )}
      </ay.For>
    </ts.InterfaceDeclaration>
  );
}
