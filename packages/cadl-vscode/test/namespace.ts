import { deepStrictEqual } from "assert";
import { Token, tokenize } from "./utils";

describe("Namespace", () => {
  it("simple global namespace", async () => {
    const tokens = await tokenize("namespace Foo");
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.meta(" ", "namespace-statement"),
      Token.identifiers.type("Foo"),
    ]);
  });

  it("subnamespace global namespace", async () => {
    const tokens = await tokenize("namespace Foo.Bar");
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.meta(" ", "namespace-statement"),
      Token.identifiers.type("Foo"),
      Token.punctuation.accessor,
      Token.identifiers.type("Bar"),
    ]);
  });

  it("simple namespace", async () => {
    const tokens = await tokenize(`
    namespace Foo { }`);
    deepStrictEqual(tokens, [
      Token.keywords.namespace,
      Token.meta(" ", "namespace-statement"),
      Token.identifiers.type("Foo"),
      Token.meta(" ", "namespace-name"),
      Token.meta("{", "namespace-body"),
      Token.meta(" ", "namespace-body"),
      Token.meta("}", "namespace-body"),
    ]);
  });
});
