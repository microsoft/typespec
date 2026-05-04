import { Tester } from "#test/test-host.js";
import { TestFile } from "#test/typescript/utils.jsx";
import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { UnionExpression } from "./expression.jsx";

it("renders a union expression", async () => {
  const { program, TestUnion } = await Tester.compile(t.code`
    union ${t.union("TestUnion")} {
      one: "one",
      two: "two"
    }
  `);

  expect(
    <TestFile program={program}>
      <UnionExpression type={TestUnion} />
    </TestFile>,
  ).toRenderTo(`"one" | "two"`);
});

it("renders a union expression without conflicting names", async () => {
  const { program, TestUnion } = await Tester.compile(t.code`
    union ${t.union("TestUnion")} {
      {common: "one"},
      {common: "one", two: "two"}
    }
  `);

  expect(
    <TestFile program={program}>
      <UnionExpression type={TestUnion} />
    </TestFile>,
  ).toRenderTo(`
    {
      common: "one";
    } | {
      common: "one";
      two: "two";
    }
  `);
});
