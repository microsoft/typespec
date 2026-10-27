import * as gql from "@pinterest/alloy-graphql";
import { type Model, getDoc } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { getComposition } from "../../lib/interface.js";
import { Field } from "../fields/index.js";

export interface InterfaceTypeProps {
  type: Model;
}

export function InterfaceType(props: InterfaceTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const properties = [...props.type.properties.values()];
  const composition = getComposition(program, props.type);
  const interfaces = composition?.map((iface) => iface.name);

  return (
    <gql.InterfaceType name={props.type.name} description={doc} interfaces={interfaces}>
      {properties.map((prop) => (
        <Field property={prop} isInput={false} />
      ))}
    </gql.InterfaceType>
  );
}
