import { Output } from "#core/index.js";
import { Tester } from "#test/test-host.js";
import type { Children } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { InterfaceDeclaration } from "../../index.js";
import { UnionDeclaration } from "./declaration.jsx";

let tester: TesterInstance;

function Wrapper(props: { children: Children }) {
  return (
    <Output program={tester.program}>
      <SourceFile path="test.ts">{props.children}</SourceFile>
    </Output>
  );
}

beforeEach(async () => {
  tester = await Tester.createInstance();
});

it("creates a union declaration (not bound to Typespec Types)", async () => {
  await tester.compile("");
  expect(
    <Wrapper>
      <UnionDeclaration name="MyUnion">"red" | "blue"</UnionDeclaration>
    </Wrapper>,
  ).toRenderTo(`type MyUnion = "red" | "blue";`);
});

it("creates a union declaration (bound to union)", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    union ${t.union("TestUnion")} {
      one: "one",
      two: "two"
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion} />
    </Wrapper>,
  ).toRenderTo(`type TestUnion = "one" | "two";`);
});

it("creates a union declaration with JSDoc", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    /**
     * Test Union
     */
    union ${t.union("TestUnion")} {
      one: "one",
      two: "two"
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion} />
    </Wrapper>,
  ).toRenderTo(`/**
 * Test Union
 */
type TestUnion = "one" | "two";`);
});

it("creates a union declaration with name override", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    union ${t.union("TestUnion")} {
      one: "one",
      two: "two"
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration export type={TestUnion} name="MyUnion" />
    </Wrapper>,
  ).toRenderTo(`export type MyUnion = "one" | "two";`);
});

it("creates a union declaration with extra children", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    union ${t.union("TestUnion")} {
      one: "one",
      two: "two"
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion}>"three"</UnionDeclaration>
    </Wrapper>,
  ).toRenderTo(`type TestUnion = "one" | "two" | "three";`);
});

it("renders a discriminated union", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    @discriminated
    union ${t.union("TestUnion")} {
      one: { oneItem: true },
      two: true
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion} />
    </Wrapper>,
  ).toRenderTo(`type TestUnion = {
  kind: "one";
  value: {
    oneItem: true;
  };
} | {
  kind: "two";
  value: true;
};`);
});

it("renders a discriminated union with custom properties", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    @discriminated(#{ discriminatorPropertyName: "dataKind", envelopePropertyName: "data" })
    union ${t.union("TestUnion")} {
      one: { oneItem: true },
      two: true
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion} />
    </Wrapper>,
  ).toRenderTo(`type TestUnion = {
  dataKind: "one";
  data: {
    oneItem: true;
  };
} | {
  dataKind: "two";
  data: true;
};`);
});

it("renders a discriminated union with named models", async () => {
  const { Pet, Cat, Dog } = await tester.compile(t.code`
    namespace DemoService;
    model ${t.model("Cat")} {
      name: string;
      meow: boolean;
    }
    model ${t.model("Dog")} {
      name: string;
      bark: boolean;
    }
    @discriminated
    union ${t.union("Pet")} {
      cat: Cat,
      dog: Dog,
    }
  `);
  expect(
    <Wrapper>
      <InterfaceDeclaration type={Cat} />
      <hbr />
      <InterfaceDeclaration type={Dog} />
      <hbr />
      <UnionDeclaration type={Pet} />
    </Wrapper>,
  ).toRenderTo(`interface Cat {
  name: string;
  meow: boolean;
}
interface Dog {
  name: string;
  bark: boolean;
}
type Pet = {
  kind: "cat";
  value: Cat;
} | {
  kind: "dog";
  value: Dog;
};`);
});

it("renders named discriminated union (no envelope)", async () => {
  const { Pet, Cat, Dog } = await tester.compile(t.code`
    namespace DemoService;
    model ${t.model("Cat")} {
      name: string;
      meow: boolean;
    }
    model ${t.model("Dog")} {
      name: string;
      bark: boolean;
    }
    @discriminated(#{ envelope: "none", discriminatorPropertyName: "dataKind" })
    union ${t.union("Pet")} {
      cat: Cat,
      dog: Dog,
    }
  `);
  expect(
    <Wrapper>
      <InterfaceDeclaration type={Cat} />
      <hbr />
      <InterfaceDeclaration type={Dog} />
      <hbr />
      <UnionDeclaration type={Pet} />
    </Wrapper>,
  ).toRenderTo(`interface Cat {
  name: string;
  meow: boolean;
}
interface Dog {
  name: string;
  bark: boolean;
}
type Pet = {
  dataKind: "cat"
} & Cat | {
  dataKind: "dog"
} & Dog;`);
});

it("renders anonymous discriminated union (no envelope)", async () => {
  const { TestUnion } = await tester.compile(t.code`
    namespace DemoService;
    @discriminated(#{ envelope: "none", discriminatorPropertyName: "dataKind" })
    union ${t.union("TestUnion")} {
      one: { oneItem: true },
      two: { secondItem: false }
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestUnion} />
    </Wrapper>,
  ).toRenderTo(`type TestUnion = {
  dataKind: "one";
  oneItem: true;
} | {
  dataKind: "two";
  secondItem: false;
};`);
});

it("creates a union declaration (bound to enum)", async () => {
  const { TestEnum } = await tester.compile(t.code`
    namespace DemoService;
    enum ${t.enum("TestEnum")} {
      one: "one",
      two: "two"
    }
  `);
  expect(
    <Wrapper>
      <UnionDeclaration type={TestEnum} />
    </Wrapper>,
  ).toRenderTo(`type TestEnum = "one" | "two";`);
});
