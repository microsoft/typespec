import { useTsp } from "#core/context/index.js";
import * as py from "@alloy-js/python";
import { isTemplateInstance, type Model, type Type } from "@typespec/compiler";
import { reportDiagnostic } from "../../../lib.js";
import { typingModule } from "../../builtins.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { ClassDeclaration } from "../class-declaration/class-declaration.js";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface TypedAliasDeclarationProps extends Omit<py.BaseDeclarationProps, "name"> {
  type: Type;
  name?: string;
}

/**
 * Create a Python type alias declaration. Pass the `type` prop to emit the
 * type alias as the provided TypeSpec type.
 *
 * For template instances (e.g., `alias StringResponse = Response<string>`),
 * this emits a dataclass instead of a type alias, since Python doesn't support
 * parameterized type aliases the way TypeScript does.
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

  // For Model template instances (e.g., alias StringResponse = Response<string>),
  // emit as a dataclass since Python doesn't support parameterized type aliases.
  // TypeSpec templates are macros that expand to concrete types.
  if ($.model.is(props.type) && isTemplateInstance(props.type)) {
    const namePolicy = py.usePythonNamePolicy();
    const plausibleName = $.type.getPlausibleName(props.type as Model);
    const name = props.name ?? namePolicy.getName(plausibleName, "class");

    return (
      <ClassDeclaration doc={doc} type={props.type} name={name} refkey={refkeys}>
        {props.children}
      </ClassDeclaration>
    );
  }

  // For other types (scalars, unions, operations), emit as a type alias
  const name = py.usePythonNamePolicy().getName(originalName, "variable");

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
