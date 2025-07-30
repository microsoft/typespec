import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { createPythonNamePolicy, SourceFile } from "@alloy-js/python";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Output } from "../../../core/index.js";
import { Atom } from "../../index.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createPythonNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.py">{props.children}</SourceFile>
    </Output>
  );
}

it("renders a class declaration with properties", async () => {
  const TestValue = await runner.compile(t.code`
    ${t.value("test")}
  `);

  expect(
    <Wrapper>
      <Atom value={TestValue.test} />
    </Wrapper>,
  ).toRenderTo(`
    "test"
  `);
});
