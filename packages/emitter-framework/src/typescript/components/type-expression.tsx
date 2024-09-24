import { refkey } from "@alloy-js/core";
import { ValueExpression, Reference } from "@alloy-js/typescript";
import { IntrinsicType, Model, Scalar, Type } from "@typespec/compiler";
import { isArray, isDeclaration, isRecord } from "../../core/utils/typeguards.js";
import { UnionExpression } from "./union-expression.js";
import {ArrayExpression} from "./array-expression.js";
import { RecordExpression } from "./record-expression.js";
import { InterfaceExpression } from "./interface-declaration.js";
import { $ } from "@typespec/compiler/typekit";

export interface TypeExpressionProps {
  type: Type;
}

export function TypeExpression({ type }: TypeExpressionProps) {
  if (isDeclaration(type) && !(type as Model).indexer) {
    // todo: probably need abstraction around deciding what's a declaration in the output
    // (it may not correspond to things which are declarations in TypeSpec?)
    return <Reference refkey={refkey(type)} />;
    //throw new Error("Reference not implemented");
  }

  switch (type.kind) {
    case "Scalar":
    case "Intrinsic":
      return <>{getScalarIntrinsicExpression(type)}</>;
    case "Boolean":
    case "Number":
    case "String":
      return <ValueExpression jsValue={type.value} />;
    case "Union":
      return <UnionExpression type={type} />;
    case "Tuple":
      return (
        <>
          [{type.values.map((element) => (
            <>
              <TypeExpression type={element} />,
            </>
          ))}]
        </>
      );
    case "EnumMember":
      return (
        <>
          {type.enum.name}.{type.name}
        </>
      );
    case "ModelProperty": 
      return <TypeExpression type={type.type} />;
    case "Model":
      if (isArray(type)) {
        const elementType = type.indexer.value;
        return <ArrayExpression elementType={elementType} />;
      }

      if (isRecord(type)) {
        const elementType = type.indexer.value;
        return <RecordExpression elementType={elementType} />;
      }

      return <InterfaceExpression type={type} />;

    default:
      console.warn("TypeExpression: unhandled type", type.kind);
  }
}

const intrinsicNameToTSType = new Map<string, string>([
  ["unknown", "unknown"],
  ["string", "string"],
  ["decimal", "number"],
  ["decimal128", "number"],
  ["int32", "number"],
  ["int16", "number"],
  ["float16", "number"],
  ["integer", "number"],
  ["float", "number"],
  ["float32", "number"],
  ["int64", "bigint"],
  ["boolean", "boolean"],
  ["null", "null"],
  ["void", "void"],
  ["numeric", "number"],
  ["uint64", "number"], // TODO: bigint?
  ["uint32", "number"],
  ["uint16", "number"],
  ["bytes", "Uint8Array"],
  ["float64", "number"], // TODO: bigint?
  ["safeint", "number"],
  ["utcDateTime", "Date"],
  ["duration", "string"],
  ["url", "string"],
]);

function getScalarIntrinsicExpression(type: Scalar | IntrinsicType): string | null {
  let intrinsicName: string;
  if($.scalar.is(type)){
    if($.scalar.isUtcDateTime(type) || $.scalar.extendsUtcDateTime(type)) {
      const encoding =  $.scalar.getEncoding(type);
      let emittedType = "Date";
      switch(encoding?.encoding) {
        case "unixTimestamp":
          emittedType = "number";
          break;
        case "rfc7231":
        case "rfc3339":
        default:
          emittedType = `Date`;
          break;
      }
  
      return emittedType;
    }

    intrinsicName = $.scalar.getStdBase(type)?.name ?? "";
  }else {
    intrinsicName = type.name;
  }

  const tsType = intrinsicNameToTSType.get(intrinsicName);
  if (!tsType) {
    throw new Error(`Unknown scalar type ${intrinsicName}`);
  }
  return tsType;
}
