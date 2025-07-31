import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { type Value } from "@typespec/compiler";

interface AtomProps {
  value: Value;
}

export function Atom(props: Readonly<AtomProps>): Children {
  switch (props.value.valueKind) {
    case "StringValue":
      return <py.Atom jsValue={props.value.value} />;
  }
}
