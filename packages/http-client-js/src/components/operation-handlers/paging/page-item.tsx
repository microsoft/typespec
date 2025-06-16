import { PagingOperation } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { TypeExpression } from "@typespec/emitter-framework/typescript";

export function getPageItemTypeName(pagingOperation: PagingOperation) {
  const { $ } = useTsp();
  const type = pagingOperation.output.pageItems.property.type;
  // only accept array type
  if (type.kind === "Model" && $.array.is(type)) {
    return <TypeExpression type={$.array.getElementType(type)} />;
  }
  // not supported and throw exceptions
  throw new Error("Not supported");
}
