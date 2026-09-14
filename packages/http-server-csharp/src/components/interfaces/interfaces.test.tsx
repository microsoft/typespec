import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, EnumDeclaration, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { beforeEach, expect, it } from "vitest";
import { efRefkey } from "../type-expression/type-expression.jsx";
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

it("renders one nullable suffix for optional nullable value parameters", async () => {
  const { Choice, PetStore } = await runner.compile(t.code`
    enum ${t.enum("Choice")} {
      one,
    }

    interface ${t.interface("PetStore")} {
      update(value?: int32 | null, choice?: Choice | null): void;
    }
  `);

  expect(
    <Wrapper>
      <EnumDeclaration name="Choice" refkey={efRefkey(Choice)}>
        One
      </EnumDeclaration>
      <hbr />
      <BusinessLogicInterface type={PetStore} />
    </Wrapper>,
  ).toRenderTo(`
    enum Choice
    {
        One
    }
    public interface IPetStore
    {
        Task UpdateAsync(int? value, Choice? choice);
    }
  `);
});
