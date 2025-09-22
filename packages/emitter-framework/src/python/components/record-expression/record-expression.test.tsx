import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

it("maps Record to Python dict", async () => {
  const { program, TestRecord } = await Tester.compile(t.code`
    alias ${t.type("TestRecord")} = Record<boolean>;
  `);

  expect(getOutput(program, [<TypeExpression type={TestRecord} />])).toRenderTo(d`dict[str, bool]`);
});
