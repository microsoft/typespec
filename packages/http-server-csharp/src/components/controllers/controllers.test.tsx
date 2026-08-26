import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, Namespace, SourceFile } from "@alloy-js/csharp";
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

function Wrapper(props: { children: Children; namespace?: string }) {
  const policy = createCSharpNamePolicy();
  const content = props.namespace ? (
    <Namespace name={props.namespace}>{props.children}</Namespace>
  ) : (
    props.children
  );
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.cs">{content}</SourceFile>
    </Output>
  );
}

function canonicalizeOp(opType: any): OperationHttpCanonicalization {
  const canonicalizer = new HttpCanonicalizer($(runner.program));
  return canonicalizer.canonicalize(opType) as OperationHttpCanonicalization;
}

async function compilePetStore() {
  const { PetStore, listPets } = await runner.compile(t.code`
    interface ${t.interface("PetStore")} {
      @route("/pets") @get ${t.op("listPets")}(): string[];
    }
  `);
  return { PetStore, canonOp: canonicalizeOp(listPets) };
}

it("renders a controller class with an action method", async () => {
  const { PetStore, canonOp } = await compilePetStore();

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

// Regression tests for https://github.com/microsoft/typespec/issues/11445.
// `[ApiController]`, `ControllerBase` and `IActionResult` come from
// `Microsoft.AspNetCore.Mvc`. They are emitted as library references so they
// resolve in every service namespace, including namespaces that start with
// `Microsoft.` (as every ARM resource provider does), where Alloy resolves them
// relative to the shared `Microsoft` ancestor namespace instead of importing them.
describe("ASP.NET Core MVC framework references resolve in any namespace (#11445)", () => {
  it("imports Microsoft.AspNetCore.Mvc and uses short names for a plain namespace", async () => {
    const { PetStore, canonOp } = await compilePetStore();

    expect(
      <Wrapper namespace="Contoso.Controllers">
        <BusinessLogicInterface type={PetStore} />
        {"\n"}
        <Controller type={PetStore} operations={[canonOp]} />
      </Wrapper>,
    ).toRenderTo(`
      using Microsoft.AspNetCore.Mvc;

      namespace Contoso.Controllers
      {
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
      }
    `);
  });

  it("qualifies the Mvc types via the ancestor namespace when the namespace starts with Microsoft.", async () => {
    const { PetStore, canonOp } = await compilePetStore();

    // No `using Microsoft.AspNetCore.Mvc;` is emitted here: the framework types
    // are qualified relative to the enclosing `Microsoft` namespace, which
    // resolves to `Microsoft.AspNetCore.Mvc.*` in C#. Before the fix these were
    // bare, unresolved identifiers (`ControllerBase`, `IActionResult`).
    expect(
      <Wrapper namespace="Microsoft.Contoso.Controllers">
        <BusinessLogicInterface type={PetStore} />
        {"\n"}
        <Controller type={PetStore} operations={[canonOp]} />
      </Wrapper>,
    ).toRenderTo(`
      namespace Microsoft.Contoso.Controllers
      {
          public interface IPetStore
          {
              Task<string[]> ListPetsAsync();
          }
          [AspNetCore.Mvc.ApiControllerAttribute]
          public partial class PetStoreController : AspNetCore.Mvc.ControllerBase
          {
              internal virtual IPetStore PetStoreImpl { get; }
              public PetStoreController(IPetStore operations)
              {
                  PetStoreImpl = operations;
              }

              [AspNetCore.Mvc.HttpGetAttribute]
              [AspNetCore.Mvc.RouteAttribute("/pets")]
              [AspNetCore.Mvc.ProducesResponseTypeAttribute((int)HttpStatusCode.OK, Type = typeof(string[]))]
              public virtual async Task<AspNetCore.Mvc.IActionResult> ListPets()
              {
                  var result = await PetStoreImpl.ListPetsAsync();
                  return Ok(result);
              }
          }
      }
    `);
  });
});
