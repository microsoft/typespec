import { List, type Children } from "@alloy-js/core";
import { getDeprecationDetails, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";

export function getDoc($: Typekit, type: Type): Children {
  const doc = $.type.getDoc(type);
  const deprecation = getDeprecationDetails($.program, type);
  if (!deprecation) {
    return doc;
  }

  const tag = deprecation.message ? `@deprecated ${deprecation.message}` : "@deprecated";
  if (!doc) {
    return tag;
  }

  // Keep the tag on its own line even when the caller wraps documentation in Prose.
  return (
    <List doubleHardline>
      {doc}
      {tag}
    </List>
  );
}
