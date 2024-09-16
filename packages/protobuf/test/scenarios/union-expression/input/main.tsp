import "@typespec/protobuf";

using TypeSpec.Protobuf;

@package
namespace Test;

alias UnionExpression = string | int32;

model UnionExpressionModel {
  @field(1) expr1: UnionExpression;
  @field(2) str1: string;
}

union UnionExpressionUnion {
  @field(1) expr2: UnionExpression;
  @field(2) str2: string;
}
