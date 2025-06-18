import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Type } from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";

/**
 * Helper to render a doc string for a given TypeSpec type.
 *
 * This is not a JSX component as it is need to returns null if the doc is undefined.
 *
 * @param doc The doc string to render.
 *
 * @returns A DocSummary component containing the rendered doc string, or undefined if no doc is available.
 */
export function getDocComments($: Typekit, type: Type): ay.Children {
  const typeDoc = $.type.getDoc(type);
  if (!typeDoc) {
    return undefined;
  }

  const typeDocElement = (
    <cs.DocSummary>
      <cs.DocFromMarkdown markdown={typeDoc}></cs.DocFromMarkdown>
    </cs.DocSummary>
  );

  const paramDocs =
    $.operation.is(type) &&
    Array.from(type.parameters.properties.values())
      .map((p) => {
        const paramDoc = $.type.getDoc(p);
        return paramDoc ? (
          <cs.DocParam name={p.name}>
            <cs.DocFromMarkdown markdown={paramDoc}></cs.DocFromMarkdown>
          </cs.DocParam>
        ) : undefined;
      })
      .filter(Boolean);

  let returnDocs = undefined;
  if ($.operation.is(type) && type.returnType) {
    const returnDoc = $.type.getDoc(type.returnType);
    if (returnDoc) {
      returnDocs = (
        <cs.DocReturns>
          <cs.DocFromMarkdown markdown={returnDoc}></cs.DocFromMarkdown>
        </cs.DocReturns>
      );
    }
  }

  return (
    <ay.List>
      {typeDocElement}
      {paramDocs}
      {returnDocs}
    </ay.List>
  );
}
