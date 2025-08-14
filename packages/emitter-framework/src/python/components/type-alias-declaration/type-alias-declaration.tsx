import * as py from "@alloy-js/python";
import type { Type } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

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

  const name = py.usePythonNamePolicy().getName(originalName, "variable");
  // TODO: See how we will handle this kind of scenario:
  // type Foo {
  //   bar(id: String): BarResponse
  //
  // Bar = Callable[[string], BarResponse]
  // class Foo:
  //   bar: Bar
  //
  // Maybe this won't done by this emitter, but we might want that eventually to be done by some emitter.
  //
  return (
    // TODO: See if there's a need to make py.VariableDeclaration consider props.children
    // (it doesn't at this moment, and there isn't a scenario where we need it)
    <py.VariableDeclaration
      doc={doc}
      name={name}
      refkey={refkeys}
      omitNone={true}
      type={<TypeExpression type={props.type} noReference />}
    >
      {props.children}
    </py.VariableDeclaration>
  );
}
