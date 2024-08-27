import { usePythonNamePolicy } from "../name-policy.js";
import { ModelProperty } from "@typespec/compiler";

export interface ClassVariableProps {
  type: ModelProperty;
}

export function ClassVariable(props: ClassVariableProps) {
  const name = usePythonNamePolicy().getName(props.type.name, "classMember");
  const varType = props.type.type;
  // TODO: Some way to configure whether you actually want types
  // Python doesn't require them.
  return (
    <>
      {name}: {varType}
    </>
  );
}
