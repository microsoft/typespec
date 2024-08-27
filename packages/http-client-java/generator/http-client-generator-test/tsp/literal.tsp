import "@typespec/rest";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using Azure.Core;

@service({
  title: "LiteralService",
})
namespace Cadl.LiteralService;

model Model {
  literal: "literal";
  optionalLiteral?: "optionalLiteral";
}

alias Request = {
  @query
  literalParam: "literalParam";

  @query
  optionalLiteralParam?: "optionalLiteralParam";
};

@route("/literal")
interface LiteralOp {
  @put
  @route("/put")
  put(...Request, @body body: Model): Model;
}
