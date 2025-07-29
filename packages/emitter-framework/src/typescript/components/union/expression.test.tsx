import { Output } from "#core/index.js";
import { Tester } from "#test/test-host.js";
import { InterfaceDeclaration, InterfaceMember } from "@alloy-js/typescript";
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
    <Output program={program}>
      <UnionExpression type={TestUnion} />
    </Output>,
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
    <Output program={program}>
      <InterfaceDeclaration name="Test">
        <InterfaceMember name="prop">
          <UnionExpression type={TestUnion} />
        </InterfaceMember>
      </InterfaceDeclaration>
    </Output>,
  ).toRenderTo(`
    interface Test {
      prop: {
        common: "one";
      } | {
        common: "one";
        two: "two";
      }
    }
  `);
});
