import * as gql from "@pinterest/alloy-graphql";
import { type Model, getDoc } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { isOneOf } from "../../lib/one-of.js";
import { Field } from "../fields/index.js";

export interface InputTypeProps {
  type: Model;
}

export function InputType(props: InputTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const properties = [...props.type.properties.values()];

  return (
    <gql.InputObjectType name={props.type.name} description={doc} oneOf={isOneOf(props.type)}>
      {properties.map((prop) => (
        <Field property={prop} isInput={true} />
      ))}
    </gql.InputObjectType>
  );
}
