import * as gql from "@pinterest/alloy-graphql";
import { type Enum, getDeprecationDetails, getDoc } from "@typespec/compiler";
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
