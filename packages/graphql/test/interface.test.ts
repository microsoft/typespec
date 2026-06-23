import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  expectTypeEquals,
  t,
} from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getComposition, isInterface } from "../src/lib/interface.js";
import { Tester } from "./test-host.js";

describe("@interface", () => {
  it("Marks the model as an interface", async () => {
    const { TestModel, program } = await Tester.compile(t.code`
      @\`interface\`
      model ${t.model("TestModel")} {}
    `);

    expect(isInterface(program, TestModel)).toBe(true);
  });
});

describe("@compose", () => {
  it("Can compose and store the composition", async () => {
    const { TestModel, AnInterface, program } = await Tester.compile(t.code`
      @\`interface\`
      model ${t.model("AnInterface")} {}

      @compose(AnInterface)
      model ${t.model("TestModel")} {}
    `);
    const composition = getComposition(program, TestModel);
    expect(composition).toBeDefined();
    expect(composition).toHaveLength(1);
    expectTypeEquals(composition![0], AnInterface);
  });

  it("Can compose multiple interfaces", async () => {
    const { TestModel, FirstInterface, SecondInterface, program } = await Tester.compile(t.code`
      @\`interface\`
      model ${t.model("FirstInterface")} {}
      @\`interface\`
      model ${t.model("SecondInterface")} {}

      @compose(FirstInterface, SecondInterface)
      model ${t.model("TestModel")} {}
    `);

    const composition = getComposition(program, TestModel);
    expect(composition).toBeDefined();
    expect(composition).toHaveLength(2);
    expectTypeEquals(composition![0], FirstInterface);
    expectTypeEquals(composition![1], SecondInterface);
  });

  it("Can spread properties from the interface", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel {
        ...AnInterface;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("Can extend properties from the interface", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel extends AnInterface {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("Can copy the interface", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel is AnInterface {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("Can receive properties from a template", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }
      
      model Template<ExtraProp> {
        prop: string;
        extraProp: ExtraProp;
      }

      @compose(AnInterface)
      model TestModel {
        ...Template<integer>;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("Requires that an implemented model is an Interface", async () => {
    const diagnostics = await Tester.diagnose(`
      model NotAnInterface {}

      @compose(NotAnInterface)
      @test model TestModel {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/invalid-interface",
      message:
        "All models used with `@compose` must be marked with `@interface`, but NotAnInterface is not.",
    });
  });

  it("Requires that all implemented models are Interfaces", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {}
      model NotAnInterface {}

      @compose(AnInterface, NotAnInterface)
      @test model TestModel {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/invalid-interface",
      message:
        "All models used with `@compose` must be marked with `@interface`, but NotAnInterface is not.",
    });
  });

  it("Allows Interfaces to implement other Interfaces", async () => {
    const { AnInterface, AnotherInterface, program } = await Tester.compile(t.code`
      @\`interface\`
      model ${t.model("AnotherInterface")} {}

      @compose(AnotherInterface)
      @\`interface\`
      model ${t.model("AnInterface")} {}
    `);

    const composition = getComposition(program, AnInterface);
    expect(composition).toBeDefined();
    expect(composition).toHaveLength(1);
    expectTypeEquals(composition![0], AnotherInterface);
  });

  it("Does not allow an interface to implement itself", async () => {
    const diagnostics = await Tester.diagnose(`
      @compose(AnInterface)
      @\`interface\`
      @test model AnInterface {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/circular-interface",
      message: "An interface cannot implement itself.",
    });
  });

  it("Requires that all Interface properties are implemented", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel {}
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/missing-interface-property",
      message:
        "Model must contain property `prop` from `AnInterface` in order to implement it in GraphQL.",
    });
  });

  it("Requires that all Interface properties are compatible", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel {
        prop: integer;
      }
    `);
    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/incompatible-interface-property",
      message: "Property `prop` is incompatible with `AnInterface`.",
    });
  });

  it("Allows additional properties", async () => {
    const diagnostics = await Tester.diagnose(`
      @\`interface\` model AnInterface {
        prop: string;
      }

      @compose(AnInterface)
      model TestModel {
        prop: string;
        anotherProp: integer;
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });
});
