import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { beforeEach, describe, expect, it } from "vitest";
import { BusinessLogicInterface } from "./interfaces.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.cs">{props.children}</SourceFile>
    </Output>
  );
}

describe("BusinessLogicInterface", () => {
  it("renders an interface with async methods", async () => {
    const { PetStore } = await runner.compile(t.code`
      interface ${t.interface("PetStore")} {
        listPets(): string[];
        getPet(petId: string): string;
      }
    `);

    expect(
      <Wrapper>
        <BusinessLogicInterface type={PetStore} />
      </Wrapper>,
    ).toRenderTo(`
      public interface IPetStore
      {
          Task<string[]> ListPetsAsync();

          Task<string> GetPetAsync(string petId);
      }
    `);
  });

  it("renders an interface with void return type", async () => {
    const { PetStore } = await runner.compile(t.code`
      interface ${t.interface("PetStore")} {
        deletePet(petId: string): void;
      }
    `);

    expect(
      <Wrapper>
        <BusinessLogicInterface type={PetStore} />
      </Wrapper>,
    ).toRenderTo(`
      public interface IPetStore
      {
          Task DeletePetAsync(string petId);
      }
    `);
  });
});
