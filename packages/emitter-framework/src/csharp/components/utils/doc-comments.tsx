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
  const doc = $.type.getDoc(type);
  if (!doc) {
    return undefined;
  }
  return (
    <cs.DocSummary>
      <cs.DocFromMarkdown markdown={doc}></cs.DocFromMarkdown>
    </cs.DocSummary>
  );
}
