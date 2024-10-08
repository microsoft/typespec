import { usePythonNamePolicy } from "../name-policy.js";
import { EnumMember, ModelProperty } from "@typespec/compiler";

export interface ClassVariableProps {
  type: ModelProperty | EnumMember;
}

export function ClassVariable(props: ClassVariableProps) {
  const name = usePythonNamePolicy().getName(props.type.name, "classMember");
  const varType = props.type.kind === "ModelProperty" ? props.type.type : "string";
  return (
    <>
      {name}: {varType}
    </>
  );
}
