import { Children } from "@alloy-js/core";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";

export interface DocstringProps {
  type?: Type;
  children?: Children;
}

export function Docstring(props: DocstringProps) {
  let children = props.children ?? [];
  if (props.type) {
    const doc = $.type.getDoc(props.type);
    if (doc && doc !== "") {
      children = doc + children;
    } else if (!props.children) {
      return undefined;
    }
  }
  return (
    <>
      """
      {children}
      """

    </>
  )
}
