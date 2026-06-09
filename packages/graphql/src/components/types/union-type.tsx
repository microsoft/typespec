import { type Union, getDoc } from "@typespec/compiler";
import * as gql from "@alloy-js/graphql";
import { useTsp } from "@typespec/emitter-framework";

export interface UnionTypeProps {
  type: Union;
}

export function UnionType(props: UnionTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const variants = [...props.type.variants.values()];
  const members = variants.map((v) => (v.type as { name: string }).name);

  return <gql.UnionType name={props.type.name!} description={doc} members={members} />;
}
