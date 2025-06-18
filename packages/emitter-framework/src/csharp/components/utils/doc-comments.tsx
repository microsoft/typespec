import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Type } from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";

/**
 * Helper to render a doc string for a given TypeSpec type.
 *
 * This is not a JSX component as it needs to return undefined if there is no doc.
 *
 * @param $ The Typekit instance
 * @param type The TypeSpec type to generate documentation for
 * @returns A DocSummary component containing the rendered doc string, or undefined if no doc is available.
 */
export function getDocComments($: Typekit, type: Type): ay.Children {
  const typeDoc = $.type.getDoc(type);
  if (!typeDoc) {
    return undefined;
  }

  const docElements: ay.Children[] = [];

  // Add main type documentation
  docElements.push(
    <cs.DocSummary>
      <cs.DocFromMarkdown markdown={typeDoc} />
    </cs.DocSummary>,
  );

  // Add operation-specific documentation if applicable
  if ($.operation.is(type)) {
    // Add parameter documentation
    const paramDocs = [];
    for (const param of type.parameters.properties.values()) {
      const paramDoc = $.type.getDoc(param);
      if (paramDoc) {
        paramDocs.push(
          <cs.DocParam name={param.name}>
            <cs.DocFromMarkdown markdown={paramDoc} />
          </cs.DocParam>,
        );
      }
    }
    docElements.push(...paramDocs);

    // Add return documentation
    if (type.returnType) {
      const returnDoc = $.type.getDoc(type.returnType);
      if (returnDoc) {
        docElements.push(
          <cs.DocReturns>
            <cs.DocFromMarkdown markdown={returnDoc} />
          </cs.DocReturns>,
        );
      }
    }
  }

  return <ay.List doubleHardline>{docElements}</ay.List>;
}
