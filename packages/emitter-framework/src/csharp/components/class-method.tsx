import * as ay from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Operation, Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "./type-expression.jsx";
import { getDocComments } from "./utils/doc-comments.jsx";
import { declarationRefkeys } from "./utils/refkey.js";

export interface ClassMethodProps extends Omit<cs.ClassMethodProps, "name"> {
  /**
   * The name of the method. If not provided, will use the operation name.
   */
  name?: string;

  /**
   * The TypeSpec operation to generate the method from.
   */
  type: Operation;
}

function isVoidType(type: Type): boolean {
  return type.kind === "Intrinsic" && type.name === "void";
}

export function ClassMethod(props: ClassMethodProps): ay.Children {
  const { $ } = useTsp();
  const [efProps, updateProps, forwardProps] = ay.splitProps(
    props,
    ["type"],
    ["async", "name", "refkey", "doc", "returns"],
  );

  const namePolicy = cs.useCSharpNamePolicy();

  // Generate method name
  const methodName = updateProps.name ?? namePolicy.getName(props.type.name, "class-method");
  const refkeys = declarationRefkeys(updateProps.refkey, props.type)[0]; // TODO: support multiple refkeys for declarations in alloy
  const doc = updateProps.doc ?? getDocComments($, efProps.type);

  // Generate parameters from operation
  const operationParameters = [...efProps.type.parameters.properties.entries()].map(
    ([name, param]) => {
      return {
        name: namePolicy.getName(name, "parameter"),
        type: <TypeExpression type={param.type} />,
        required: !param.optional,
      };
    },
  );

  // Generate return type
  let returnType: ay.Children;
  if (updateProps.returns) {
    returnType = updateProps.returns;
  } else if (updateProps.async) {
    const baseReturnType = <TypeExpression type={efProps.type.returnType} />;
    if (isVoidType(efProps.type.returnType)) {
      returnType = "Task";
    } else {
      returnType = ay.code`Task<${baseReturnType}>`;
    }
  } else if (isVoidType(efProps.type.returnType)) {
    returnType = undefined;
  } else {
    returnType = <TypeExpression type={efProps.type.returnType} />;
  }

  return (
    <cs.ClassMethod
      {...forwardProps}
      name={methodName}
      refkey={refkeys}
      parameters={operationParameters}
      returns={returnType}
      async={updateProps.async}
      doc={doc}
    ></cs.ClassMethod>
  );
}
