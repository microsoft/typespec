import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, Namespace, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Output } from "../../../core/index.js";
import { ExtensibleEnumDeclaration } from "./extensible-enum.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">{props.children}</SourceFile>
      </Namespace>
    </Output>
  );
}

it("renders extensible enum from union", async () => {
  const { TestEnum } = await runner.compile(t.code`
    union ${t.union("TestEnum")} {
      string,
      up: "up",
      down: "down",
    }
  `);

  expect(
    <Wrapper>
      <ExtensibleEnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    namespace TestNamespace
    {
        public readonly partial struct TestEnum : IEquatable<TestEnum>
        {
            private readonly string _value;

            TestEnum(string value)
            {
                _value = value;
            }

            public static TestEnum Up { get; } = new TestEnum("up");
            public static TestEnum Down { get; } = new TestEnum("down");

            public bool Equals(
                TestEnum other
            ) => string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

            public override string ToString() => _value;
        }
    }
  `);
});
