import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe.only("vscode: tmlanguage: Models", () => {
  it("simple model", async () => {
    const tokens = await tokenize("model Foo {}");
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("model with extends", async () => {
    const tokens = await tokenize("model Foo extends Bar {}");
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.keywords.extends,
      Token.identifiers.type("Bar"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("model with is", async () => {
    const tokens = await tokenize("model Foo is Bar {}");
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.keywords.is,
      Token.identifiers.type("Bar"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("single template argument model", async () => {
    const tokens = await tokenize("model Foo<T> {}");
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("T"),
      Token.punctuation.typeParameters.end,
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("multiple template argument model", async () => {
    const tokens = await tokenize("model Foo<A, B, C> {}");
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("A"),
      Token.punctuation.comma,
      Token.identifiers.type("B"),
      Token.punctuation.comma,
      Token.identifiers.type("C"),
      Token.punctuation.typeParameters.end,
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("model with basic properties", async () => {
    const tokens = await tokenize(`
    model Foo {
      prop1: string;
      prop2: int32;
    }`);
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.identifiers.variable("prop1"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
      Token.punctuation.semicolon,
      Token.identifiers.variable("prop2"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("int32"),
      Token.punctuation.semicolon,
      Token.punctuation.closeBrace,
    ]);
  });

  it("model nested model ", async () => {
    const tokens = await tokenize(`
    model Foo {
      nested: {
        prop1: string;
      };
    }`);
    deepStrictEqual(tokens, [
      Token.keywords.model,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.identifiers.variable("nested"),
      Token.operators.typeAnnotation,
      Token.punctuation.openBrace,
      Token.identifiers.variable("prop1"),
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
      Token.punctuation.semicolon,
      Token.punctuation.closeBrace,
      Token.punctuation.semicolon,
      Token.punctuation.closeBrace,
    ]);
  });
});
