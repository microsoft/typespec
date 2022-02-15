import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe("vscode: tmlanguage: Operations", () => {
  it("simple operation", async () => {
    const tokens = await tokenize("op foo(): string");
    deepStrictEqual(tokens, [
      Token.keywords.operation,
      Token.identifiers.functionName("foo"),
      Token.punctuation.openParen,
      Token.punctuation.closeParen,
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
    ]);
  });

  it("operation with parameters", async () => {
    const tokens = await tokenize("op foo(param1: string, param2: int32): string");
    deepStrictEqual(tokens, [
      Token.keywords.operation,
      Token.identifiers.functionName("foo"),
      Token.punctuation.openParen,

      Token.identifiers.variable("param1"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
      Token.punctuation.comma,

      Token.identifiers.variable("param2"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("int32"),

      Token.punctuation.closeParen,
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
    ]);
  });

  it("operation with decorated parameters", async () => {
    const tokens = await tokenize("op foo(@path param1: string, @query param2?: int32): string");
    deepStrictEqual(tokens, [
      Token.keywords.operation,
      Token.identifiers.functionName("foo"),
      Token.punctuation.openParen,

      Token.identifiers.functionName("path"),
      Token.identifiers.variable("param1"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
      Token.punctuation.comma,

      Token.identifiers.functionName("query"),
      Token.identifiers.variable("param2"),
      Token.operators.optional,
      Token.operators.typeAnnotation,
      Token.identifiers.type("int32"),

      Token.punctuation.closeParen,
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
    ]);
  });
});
