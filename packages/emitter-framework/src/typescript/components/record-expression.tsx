import { Type } from "@typespec/compiler";
import { TypeExpression } from "./type-expression.js";

export interface RecordExpressionProps {
  elementType: Type;
}

export function RecordExpression({ elementType }: RecordExpressionProps) {
  return (
    <>
      Record{`<string,`}
      <TypeExpression type={elementType} />
      {`>`}
    </>
  );
}
