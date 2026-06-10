import { type Model, getDoc } from "@typespec/compiler";
import * as gql from "@alloy-js/graphql";
import { useTsp } from "@typespec/emitter-framework";
import { getComposition } from "../../lib/interface.js";
import { Field } from "../fields/index.js";

export interface ObjectTypeProps {
  type: Model;
}

export function ObjectType(props: ObjectTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const properties = [...props.type.properties.values()];
  const composition = getComposition(program, props.type);
  const interfaces = composition?.map((iface) => iface.name);

  return (
    <gql.ObjectType name={props.type.name} description={doc} interfaces={interfaces}>
      {properties.map((prop) => (
        <Field property={prop} isInput={false} />
      ))}
    </gql.ObjectType>
  );
}
