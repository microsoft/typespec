import { $ } from "@typespec/compiler/typekit";
import { usePythonNamePolicy } from "../name-policy.js";

export interface ConstantDeclarationProps {
  name: string;
  value: string | number | undefined;
}

export function ConstantDeclaration({ name, value }: ConstantDeclarationProps) {
  // COMMENT: Can't use `useNamePolicy` here because I can't query strings directly.
  // TODO: Should convert to snake_case, uppercase
  const namer = usePythonNamePolicy();
  const constantName = namer.getName(name, "constant");
  
  let valExpression = "";
  if (typeof value === "string") {
    valExpression = ` = "${value}"`;
  } else if (typeof value === "number") {
    valExpression = ` = ${value}`;
  }
  return (
    <>
      {constantName}{valExpression}
    </>
  );
}
