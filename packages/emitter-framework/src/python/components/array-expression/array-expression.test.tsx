import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

it("maps array expression to Python list", async () => {
  const { program, TestArray } = await Tester.compile(t.code`
    alias ${t.type("TestArray")} = string[];
  `);

  expect(getOutput(program, [<TypeExpression type={TestArray} />])).toRenderTo(d`list[str]`);
});
