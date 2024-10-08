import { IntrinsicType, Scalar, Type } from "@typespec/compiler";
import { Reference } from "./reference.js";
import { TypeLiteral } from "./type-literal.js";
import { isArray, isDeclaration, isRecord } from "../../core/utils/typeguards.js";
import { refkey } from "@alloy-js/core";
import { ArrayExpression, ClassExpression, DictionaryExpression } from "./index.js";
import { $ } from "@typespec/compiler/typekit";

export interface TypeExpressionProps {
  type: Type;
}

export function TypeExpression(props: TypeExpressionProps) {
  switch (props.type.kind) {
    case "Scalar":
    case "Intrinsic":
      return getScalarIntrinsicExpression(props.type);
  }

  if (isDeclaration(props.type) && !$.record.is(props.type)) {
    const propRefkey = refkey(props.type);
    return <Reference refkey={propRefkey} />;
  }

  switch (props.type.kind) {
    case "Boolean":
    case "Number":
    case "String":
      return <TypeLiteral type={props.type} />;
    // TODO: Enable these as we support them
    // case "Union":
    //   return <UnionExpression type={type} />;
    // case "Tuple":
    //   return (
    //     <>
    //       <Reference builtin={stdlib.typing.Tuple} />[
    //       {type.values.map((element) => (
    //         <>
    //           <TypeExpression type={element} />,
    //         </>
    //       ))}
    //       ]
    //     </>
    //   );
    // case "EnumMember":
    //   return (
    //     <>
    //       <Reference builtin={stdlib.typing.Literal} />[{type.enum.name}.{type.name}.value]
    //     </>
    //   );
    case "Model":
      if ($.array.is(props.type)) {
        const elementType = props.type.indexer?.value;
        if (!elementType) {
          throw new Error("Array type must have an indexer");
        }
        return <ArrayExpression elementType={elementType} />;
      }

      if ($.record.is(props.type)) {
        const elementType = props.type.indexer?.value;
        if (!elementType) {
          throw new Error("Record type must have an indexer");
        }
        return <DictionaryExpression elementType={elementType} />;
      }
      return <ClassExpression type={props.type} />;
    default:
      throw new Error(props.type.kind + " not supported in TypeExpression");
  }
}

const intrinsicNameToPythonType = new Map<string, string>([
  ["unknown", "Any"],
  ["string", "str"],
  ["int32", "int"],
  ["int16", "int"],
  ["float16", "float"],
  ["integer", "int"],
  ["float", "float"],
  ["float32", "float"],
  ["int64", "int"], // Python's int can handle arbitrarily large integers
  ["boolean", "bool"],
  ["null", "None"],
  ["void", "None"],
  ["numeric", "float"], // Alternatively, "Union[int, float]" if mixed types are common
  ["uint64", "int"], // Python's int can handle unsigned 64-bit integers
  ["uint32", "int"],
  ["uint16", "int"],
  ["bytes", "bytes"],
  ["float64", "float"],
  ["safeint", "int"],
  ["utcDateTime", "datetime.datetime"],
  ["url", "str"],
]);

function getScalarIntrinsicExpression(type: Scalar | IntrinsicType): string {
  if (type.kind === "Scalar" && type.baseScalar && type.namespace?.name !== "TypeSpec") {
    // This is a declared scalar
    return <Reference refkey={refkey(type)} />;
  }
  const pythonType = intrinsicNameToPythonType.get(type.name);
  if (!pythonType) {
    throw new Error(`Unknown scalar type ${type.name}`);
  }
  return pythonType;
}
