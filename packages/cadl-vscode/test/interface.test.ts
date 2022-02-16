import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe("vscode: tmlanguage: interfaces", () => {
  it("empty interface", async () => {
    const tokens = await tokenize("interface Foo {}");
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("interface with single mixes", async () => {
    const tokens = await tokenize("interface Foo mixes Bar {}");
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.keywords.mixes,
      Token.identifiers.type("Bar"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("interface with multiple mixes", async () => {
    const tokens = await tokenize("interface Foo mixes Bar1, Bar2 {}");
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.keywords.mixes,
      Token.identifiers.type("Bar1"),
      Token.punctuation.comma,
      Token.identifiers.type("Bar2"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("template interface", async () => {
    const tokens = await tokenize("interface Foo<T> {}");
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("T"),
      Token.punctuation.typeParameters.end,
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("template interface with mixes", async () => {
    const tokens = await tokenize("interface Foo<T> mixes Bar<T> {}");
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("T"),
      Token.punctuation.typeParameters.end,
      Token.keywords.mixes,
      Token.identifiers.type("Bar"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("T"),
      Token.punctuation.typeParameters.end,
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("interface with operations", async () => {
    const tokens = await tokenize(`
    interface Foo {
      bar(): string;
    }`);
    deepStrictEqual(tokens, [
      Token.keywords.interface,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.identifiers.functionName("bar"),
      Token.punctuation.openParen,
      Token.punctuation.closeParen,
      Token.operators.typeAnnotation,
      Token.identifiers.type("string"),
      Token.punctuation.closeBrace,
    ]);
  });
});
