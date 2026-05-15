import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import {
  createCSharpNamePolicy,
  ClassDeclaration as CsClassDeclaration,
  SourceFile,
} from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Output } from "@typespec/emitter-framework";
import {
  HttpCanonicalizer,
  type OperationHttpCanonicalization,
} from "@typespec/http-canonicalization";
import { beforeEach, describe, expect, it } from "vitest";
import { ControllerAction } from "./controller-action.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.cs">
        <CsClassDeclaration name="TestController">{props.children}</CsClassDeclaration>
      </SourceFile>
    </Output>
  );
}

function canonicalizeOp(opType: any): OperationHttpCanonicalization {
  const canonicalizer = new HttpCanonicalizer($(runner.program));
  return canonicalizer.canonicalize(opType) as OperationHttpCanonicalization;
}

describe("ControllerAction", () => {
  it("renders a GET action", async () => {
    const { listPets } = await runner.compile(t.code`
      interface PetStore {
        @route("/pets") @get ${t.op("listPets")}(): string[];
      }
    `);

    const canonOp = canonicalizeOp(listPets);

    expect(
      <Wrapper>
        <ControllerAction operation={canonOp} implFieldName="PetStoreImpl" />
      </Wrapper>,
    ).toRenderTo(`
      class TestController
      {
          [HttpGet]
          [Route("/pets")]
          [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(string[]))]
          public virtual async Task<IActionResult> ListPets()
          {
              var result = await PetStoreImpl.ListPetsAsync();
              return Ok(result);
          }
      }
    `);
  });

  it("renders a DELETE action with path param", async () => {
    const { deletePet } = await runner.compile(t.code`
      interface PetStore {
        @route("/pets/{petId}") @delete ${t.op("deletePet")}(@path petId: string): void;
      }
    `);

    const canonOp = canonicalizeOp(deletePet);

    expect(
      <Wrapper>
        <ControllerAction operation={canonOp} implFieldName="PetStoreImpl" />
      </Wrapper>,
    ).toRenderTo(`
      class TestController
      {
          [HttpDelete]
          [Route("/pets/{petId}")]
          [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
          public virtual async Task<IActionResult> DeletePet(string petId)
          {
              await PetStoreImpl.DeletePetAsync(petId);
              return NoContent();
          }
      }
    `);
  });
});
