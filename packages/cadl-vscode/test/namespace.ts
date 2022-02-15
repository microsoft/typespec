import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe("vscode: tmlanguage: Namespace", () => {
  it("simple global namespace", async () => {
    const tokens = await tokenize("namespace Foo;");
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.identifiers.type("Foo"),
      Token.punctuation.semicolon,
    ]);
  });

  it("subnamespace global namespace", async () => {
    const tokens = await tokenize("namespace Foo.Bar;");
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.identifiers.type("Foo"),
      Token.punctuation.accessor,
      Token.identifiers.type("Bar"),
      Token.punctuation.semicolon,
    ]);
  });

  it("simple namespace", async () => {
    const tokens = await tokenize(`
    namespace Foo {

    }`);
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
    ]);
  });

  it("nested namespace", async () => {
    const tokens = await tokenize(`
    namespace Foo {
      namespace Bar {
        
      }
    }`);
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.identifiers.type("Foo"),
      Token.punctuation.openBrace,
      Token.keywords.namespace,
      Token.identifiers.type("Bar"),
      Token.punctuation.openBrace,
      Token.punctuation.closeBrace,
      Token.punctuation.closeBrace,
    ]);
  });
});
