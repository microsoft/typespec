import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { Output } from "../../../core/index.js";
import { TypeExpression } from "../type-expression.jsx";
import { ExtensibleEnumDeclaration } from "./extensible-enum.jsx";

let tester: TesterInstance;

beforeEach(async () => {
  tester = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={tester.program} namePolicy={policy}>
      <SourceFile path="test.cs">{props.children}</SourceFile>
    </Output>
  );
}

it("pass struct properties down", async () => {
  const { TestEnum } = await tester.compile(t.code`
    union ${t.union("TestEnum")} {
      string,
      a: "a",
    }
  `);

  expect(
    <Wrapper>
      <ExtensibleEnumDeclaration public readonly={false} partial type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    public partial struct TestEnum : IEquatable<TestEnum>
    {
        private readonly string _value;

        TestEnum(string value)
        {
            _value = value;
        }

        public static TestEnum A { get; } = new TestEnum(@"a");

        public bool Equals(TestEnum other) =>
            string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override bool Equals(object? obj) => obj is TestEnum other && Equals(other);

        public override int GetHashCode() =>
            _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        public override string ToString() => _value;

        public static bool operator ==(TestEnum left, TestEnum right) => left.Equals(right);

        public static bool operator !=(TestEnum left, TestEnum right) => !left.Equals(right);
    }
  `);
});

it("renders union with string variants", async () => {
  const { TestEnum } = await tester.compile(t.code`
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
    readonly struct TestEnum : IEquatable<TestEnum>
    {
        private readonly string _value;

        TestEnum(string value)
        {
            _value = value;
        }

        public static TestEnum Up { get; } = new TestEnum(@"up");
        public static TestEnum Down { get; } = new TestEnum(@"down");

        public bool Equals(TestEnum other) =>
            string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override bool Equals(object? obj) => obj is TestEnum other && Equals(other);

        public override int GetHashCode() =>
            _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        public override string ToString() => _value;

        public static bool operator ==(TestEnum left, TestEnum right) => left.Equals(right);

        public static bool operator !=(TestEnum left, TestEnum right) => !left.Equals(right);
    }
  `);
});

it("renders string-based enums with case-insensitive equality", async () => {
  const { WidgetColor } = await tester.compile(t.code`
      union ${t.union("WidgetColor")} {
        Default: "default";
        "blue-value": "blue";
        "camelCase";
      }
      `);

  const tree = (
    <Wrapper>
      <ExtensibleEnumDeclaration type={WidgetColor} />
    </Wrapper>
  );

  await expect(tree).toRenderToAsync(`
    readonly struct WidgetColor : IEquatable<WidgetColor>
    {
        private readonly string _value;

        WidgetColor(string value)
        {
            _value = value;
        }

        public static WidgetColor Default { get; } = new WidgetColor(@"default");
        public static WidgetColor BlueValue { get; } = new WidgetColor(@"blue");
        public static WidgetColor CamelCase { get; } = new WidgetColor(@"camelCase");

        public bool Equals(WidgetColor other) =>
            string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override bool Equals(object? obj) => obj is WidgetColor other && Equals(other);

        public override int GetHashCode() =>
            _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        public override string ToString() => _value;

        public static bool operator ==(WidgetColor left, WidgetColor right) => left.Equals(right);

        public static bool operator !=(WidgetColor left, WidgetColor right) => !left.Equals(right);
    }
    `);
});

it("renders number-based enums with integer equality", async () => {
  const { WidgetSize } = await tester.compile(t.code`
      union ${t.union("WidgetSize")} {
        Small: 1;
        2;
      }
      `);

  const tree = (
    <Wrapper>
      <ExtensibleEnumDeclaration type={WidgetSize} />
    </Wrapper>
  );

  await expect(tree).toRenderToAsync(`
    readonly struct WidgetSize : IEquatable<WidgetSize>
    {
        private readonly int _value;

        WidgetSize(int value)
        {
            _value = value;
        }

        public static WidgetSize Small { get; } = new WidgetSize(1);
        public static WidgetSize NumberValue_2 { get; } = new WidgetSize(2);

        public bool Equals(WidgetSize other) => _value == other._value;

        public override bool Equals(object? obj) => obj is WidgetSize other && Equals(other);

        public override int GetHashCode() =>
            _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        public override string ToString() => _value;

        public static bool operator ==(WidgetSize left, WidgetSize right) => left.Equals(right);

        public static bool operator !=(WidgetSize left, WidgetSize right) => !left.Equals(right);
    }
    `);
});

it("is referencable in TypeExpression by default", async () => {
  const { TestEnum } = await tester.compile(t.code`
    union ${t.union("TestEnum")} {
      string,
      a: "a",
    }
  `);

  expect(
    <Wrapper>
      ref: <TypeExpression type={TestEnum} />
      <hbr />
      <ExtensibleEnumDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`
    ref: TestEnum
    readonly struct TestEnum : IEquatable<TestEnum>
    {
        private readonly string _value;

        TestEnum(string value)
        {
            _value = value;
        }

        public static TestEnum A { get; } = new TestEnum(@"a");

        public bool Equals(TestEnum other) =>
            string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

        public override bool Equals(object? obj) => obj is TestEnum other && Equals(other);

        public override int GetHashCode() =>
            _value != null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

        public override string ToString() => _value;

        public static bool operator ==(TestEnum left, TestEnum right) => left.Equals(right);

        public static bool operator !=(TestEnum left, TestEnum right) => !left.Equals(right);
    }
  `);
});
