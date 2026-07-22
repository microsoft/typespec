import * as gql from "@pinterest/alloy-graphql";
import { type Scalar, getDoc } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";

export interface ScalarTypeProps {
  type: Scalar;
  specificationUrl?: string;
}

export function ScalarType(props: ScalarTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);

  return (
    <gql.ScalarType
      name={props.type.name}
      description={doc}
      specifiedByUrl={props.specificationUrl}
    />
  );
}
