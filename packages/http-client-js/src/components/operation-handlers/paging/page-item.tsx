/* 
  This file provides a helper function to extract the TypeScript type of page items 
  from a paging operation output. It ensures that the output type is an array and 
  returns the type of the array elements for further processing.
*/

import { PagingOperation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { TypeExpression } from "@typespec/emitter-framework/typescript";

/**
 * Extracts and returns the element type of the page items array from a paging operation.
 *
 * This function first retrieves the type of the page items property from the paging operation's output.
 * It then checks if the type is a model representing an array using the typekit utilities.
 * If the type is an acceptable array model, the function returns a TypeExpression component
 * constructed with the element type of the array.
 *
 * @param pagingOperation - The paging operation object containing the output details.
 * @returns A JSX element representing the TypeExpression for the array element's type.
 * @throws Error if the page items property type is not a supported array model.
 */
export function getPageItemTypeName(pagingOperation: PagingOperation) {
  // Retrieve the type of the pageItems property from the output of the paging operation
  const type = pagingOperation.output.pageItems.property.type;

  // Check if the type is a Model and also an array using the experimental typekit utilities
  if (type.kind === "Model" && $.array.is(type)) {
    // Get the element type of the array and return it wrapped in a TypeExpression component
    return <TypeExpression type={$.array.getElementType(type)} />;
  }
  // If the type is not an array model, throw an error indicating unsupported type
  throw new Error("Not supported");
}
