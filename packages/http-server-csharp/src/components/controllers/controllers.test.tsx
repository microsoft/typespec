import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Output } from "@typespec/emitter-framework";
import {
  HttpCanonicalizer,
  type OperationHttpCanonicalization,
} from "@typespec/http-canonicalization";
import { beforeEach, describe, expect, it } from "vitest";
import { BusinessLogicInterface } from "../interfaces/interfaces.jsx";
import { Controller } from "./controllers.jsx";

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

function canonicalizeOp(opType: any): OperationHttpCanonicalization {
  const canonicalizer = new HttpCanonicalizer($(runner.program));
  return canonicalizer.canonicalize(opType) as OperationHttpCanonicalization;
}

describe("Controller", () => {
  it("renders a controller class with an action method", async () => {
    const { PetStore, listPets } = await runner.compile(t.code`
      interface ${t.interface("PetStore")} {
        @route("/pets") @get ${t.op("listPets")}(): string[];
      }
    `);

    const canonOp = canonicalizeOp(listPets);

    expect(
      <Wrapper>
        <BusinessLogicInterface type={PetStore} />
        {"\n"}
        <Controller type={PetStore} operations={[canonOp]} />
      </Wrapper>,
    ).toRenderTo(`
      using Microsoft.AspNetCore.Mvc;

      public interface IPetStore
      {
          Task<string[]> ListPetsAsync();
      }
      [ApiController]
      public partial class PetStoreController : ControllerBase
      {
          internal virtual IPetStore PetStoreImpl { get; }
          public PetStoreController(IPetStore operations)
          {
              PetStoreImpl = operations;
          }

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
});
