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
import { beforeEach, expect, it } from "vitest";
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
    using Microsoft.AspNetCore.Mvc;

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
    using Microsoft.AspNetCore.Mvc;

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

it("does not assign a result for void success unions with error responses", async () => {
  const { deletePet } = await runner.compile(t.code`
    @error
    model ErrorResponse {
      code: string;
    }

    op ServiceOperation<Response>(): Response | ErrorResponse;

    interface PetStore {
      @route("/pets") @delete ${t.op("deletePet")} is ServiceOperation<void>;
    }
  `);

  const canonOp = canonicalizeOp(deletePet);

  expect(
    <Wrapper>
      <ControllerAction operation={canonOp} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpDelete]
        [Route("/pets")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> DeletePet()
        {
            await PetStoreImpl.DeletePetAsync();
            return NoContent();
        }
    }
  `);
});

it("preserves result handling for value success unions with error responses", async () => {
  const { getPet } = await runner.compile(t.code`
    @error
    model ErrorResponse {
      code: string;
    }

    op ServiceOperation<Response>(): Response | ErrorResponse;

    interface PetStore {
      @route("/pets") @get ${t.op("getPet")} is ServiceOperation<string>;
    }
  `);

  const canonOp = canonicalizeOp(getPet);

  expect(
    <Wrapper>
      <ControllerAction operation={canonOp} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpGet]
        [Route("/pets")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(string))]
        public virtual async Task<IActionResult> GetPet()
        {
            var result = await PetStoreImpl.GetPetAsync();
            return Ok(result);
        }
    }
  `);
});

it("orders request model call arguments to match the business interface", async () => {
  const { updatePet } = await runner.compile(t.code`
    model UpdatePetRequest {
      optionalTag?: string;
      age: int32;
    }

    interface PetStore {
      @route("/pets/{petId}") @post ${t.op("updatePet")}(
        @path petId: string,
        ...UpdatePetRequest,
        @query apiVersion: string,
      ): void;
    }
  `);

  const canonOp = canonicalizeOp(updatePet);

  expect(
    <Wrapper>
      <ControllerAction
        operation={canonOp}
        implFieldName="PetStoreImpl"
        requestModel={{ name: "PetStoreUpdatePetRequest", op: canonOp, ifaceName: "PetStore" }}
      />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/pets/{petId}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> UpdatePet(
            string petId,
            PetStoreUpdatePetRequest body,
            [FromQuery(Name="apiVersion")]
            string apiVersion
        )
        {
            await PetStoreImpl.UpdatePetAsync(petId, body.Age, apiVersion, body.OptionalTag);
            return NoContent();
        }
    }
  `);
});

it("orders protocol parameter call arguments to match the business interface", async () => {
  const { getPet, businessGetPet } = await runner.compile(t.code`
    interface PetStore {
      @route("/pets/{petId}") @get ${t.op("getPet")}(
        @path petId: string,
        @header feature: string,
        @query apiVersion: string,
      ): string;

      ${t.op("businessGetPet")}(
        feature: string,
        petId: string,
        apiVersion: string,
      ): string;
    }
  `);

  const canonOp = canonicalizeOp(getPet);

  expect(
    <Wrapper>
      <ControllerAction
        operation={canonOp}
        businessOperation={businessGetPet}
        implFieldName="PetStoreImpl"
      />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpGet]
        [Route("/pets/{petId}")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(string))]
        public virtual async Task<IActionResult> GetPet(
            string petId,
            [FromHeader(Name="feature")]
            string feature,
            [FromQuery(Name="apiVersion")]
            string apiVersion
        )
        {
            var result = await PetStoreImpl.GetPetAsync(feature, petId, apiVersion);
            return Ok(result);
        }
    }
  `);
});
