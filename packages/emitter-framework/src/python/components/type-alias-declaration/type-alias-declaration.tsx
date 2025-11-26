import { useTsp } from "#core/context/index.js";
import { namekey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Type } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { typingModule } from "../../builtins.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface TypedAliasDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  type: Type;
  name?: string;
}

/**
 * Create a Python type alias declaration. Pass the `type` prop to emit the
 * type alias as the provided TypeSpec type.
 */
export function TypeAliasDeclaration(props: TypedAliasDeclarationProps) {
  const { $ } = useTsp();

  const originalName =
    props.name ??
    ("name" in props.type && typeof props.type.name === "string" ? props.type.name : "");

  if (!originalName || originalName === "") {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }

  const doc = props.doc ?? $.type.getDoc(props.type);
  const refkeys = declarationRefkeys(props.refkey, props.type);

  let name: any;
  if ("templateMapper" in (props.type as any) && (props.type as any).templateMapper) {
    // Template instance alias: use the alias name (like StringResponse in alias StringResponse = Response<string>)
    const plausibleName = $.type.getPlausibleName(props.type as any);
    name = namekey(plausibleName, { ignoreNamePolicy: true });
  } else {
    name = py.usePythonNamePolicy().getName(originalName, "variable");
  }

  return (
    <py.VariableDeclaration
      doc={doc}
      name={name}
      refkey={refkeys}
      omitNone={true}
      type={typingModule["."]["TypeAlias"]}
      initializer={<TypeExpression type={props.type} noReference />}
    >
      {props.children}
    </py.VariableDeclaration>
  );
}
