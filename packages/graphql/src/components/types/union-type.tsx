import * as gql from "@pinterest/alloy-graphql";
import { type Model, type Union, getDoc } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";

/**
 * A Union guaranteed to have a name after mutation.
 * The mutation engine ensures this: anonymous unions get derived names.
 */
export interface GraphQLUnion extends Union {
  name: string;
}

export interface UnionTypeProps {
  type: GraphQLUnion;
}

export function UnionType(props: UnionTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const variants = [...props.type.variants.values()];
  const members = variants.map((v) => (v.type as Model).name);

  return <gql.UnionType name={props.type.name} description={doc} members={members} />;
}
