import { PagingOperation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { TypeExpression } from "@typespec/emitter-framework/typescript";

export function getPageItemTypeName(pagingOperation: PagingOperation) {
  const type = pagingOperation.output.pageItems.property.type;
  // only accept array type
  if (type.kind === "Model" && $.array.is(type)) {
    return <TypeExpression type={$.array.getElementType(type)} />;
  }
  // not supported and throw exceptions
  throw new Error("Not supported");
}
