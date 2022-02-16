import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe.only("vscode: tmlanguage: alias", () => {
  it("simple alias", async () => {
    const tokens = await tokenize("alias Foo = string");
    deepStrictEqual(tokens, [
      Token.keywords.alias,
      Token.identifiers.type("Foo"),
      Token.operators.assignement,
      Token.identifiers.type("string"),
    ]);
  });
  it("templated alias", async () => {
    const tokens = await tokenize("alias Foo<T> = T");
    deepStrictEqual(tokens, [
      Token.keywords.alias,
      Token.identifiers.type("Foo"),
      Token.punctuation.typeParameters.begin,
      Token.identifiers.type("T"),
      Token.punctuation.typeParameters.end,
      Token.operators.assignement,
      Token.identifiers.type("T"),
    ]);
  });
});
