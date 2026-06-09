import { type Enum, getDoc, getDeprecationDetails } from "@typespec/compiler";
import * as gql from "@alloy-js/graphql";
import { useTsp } from "@typespec/emitter-framework";

export interface EnumTypeProps {
  type: Enum;
}

export function EnumType(props: EnumTypeProps) {
  const { program } = useTsp();
  const doc = getDoc(program, props.type);
  const members = [...props.type.members.values()];

  return (
    <gql.EnumType name={props.type.name} description={doc}>
      {members.map((member) => (
        <gql.EnumValue
          name={member.name}
          description={getDoc(program, member)}
          deprecated={getDeprecationDetails(program, member)?.message}
        />
      ))}
    </gql.EnumType>
  );
}
