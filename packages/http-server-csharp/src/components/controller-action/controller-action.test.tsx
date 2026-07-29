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

import { ServerClassDeclaration } from "../models/models.jsx";

// Renders a referenced model in its own file plus the controller action, so the
// action's type references resolve. Mirrors the real multi-file emitter output.
function ModelAndAction(props: { modelType: any; action: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="Model.cs">
        <ServerClassDeclaration type={props.modelType} />
      </SourceFile>
      <SourceFile path="Controller.cs">
        <CsClassDeclaration name="TestController">{props.action}</CsClassDeclaration>
      </SourceFile>
    </Output>
  );
}

it("generates appropriate types for literals in operation parameters", async () => {
  const { literalParams } = await runner.compile(t.code`
    model LiteralHeaders {
      @header intProp: 8;
      @header floatProp: 3.14;
      @header stringProp: "A string of characters";
      @header stringTempProp: "\${LiteralHeaders.stringProp} and then some";
      @header trueProp: true;
      @header falseProp: false;
    }
    interface Svc {
      @route("/lit") @post ${t.op("literalParams")}(...LiteralHeaders): void;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(literalParams)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/lit")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> LiteralParams(
            [FromHeader(Name="int-prop")]
            int intProp = 8,
            [FromHeader(Name="float-prop")]
            double floatProp = 3.14,
            [FromHeader(Name="string-prop")]
            string stringProp = "A string of characters",
            [FromHeader(Name="string-temp-prop")]
            string stringTempProp = "A string of characters and then some",
            [FromHeader(Name="true-prop")]
            bool trueProp = true,
            [FromHeader(Name="false-prop")]
            bool falseProp = false
        )
        {
            await PetStoreImpl.LiteralParamsAsync(intProp, floatProp, stringProp, stringTempProp, trueProp, falseProp);
            return NoContent();
        }
    }
  `);
});

it("generates appropriate types for literal tuples in operation parameters", async () => {
  const { literalTupleParams } = await runner.compile(t.code`
    model TupleHeaders {
      @header intProp: [8, 10];
      @header floatProp: [3.14, 5.2];
      @header stringProp: "string of characters";
      @header stringArrayProp: ["A string of characters", "and another"];
      @header stringTempProp: ["A \${TupleHeaders.stringProp} and then some", "Yet another \${TupleHeaders.stringProp}"];
      @header trueProp: [true, true];
      @header falseProp: [false, false];
    }
    interface Svc {
      @route("/littuple") @post ${t.op("literalTupleParams")}(...TupleHeaders): void;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction
        operation={canonicalizeOp(literalTupleParams)}
        implFieldName="PetStoreImpl"
      />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/littuple")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> LiteralTupleParams(
            [FromHeader(Name="int-prop")]
            int[] intProp,
            [FromHeader(Name="float-prop")]
            double[] floatProp,
            [FromHeader(Name="string-array-prop")]
            string[] stringArrayProp,
            [FromHeader(Name="string-temp-prop")]
            string[] stringTempProp,
            [FromHeader(Name="true-prop")]
            bool[] trueProp,
            [FromHeader(Name="false-prop")]
            bool[] falseProp,
            [FromHeader(Name="string-prop")]
            string stringProp = "string of characters"
        )
        {
            await PetStoreImpl.LiteralTupleParamsAsync(intProp, floatProp, stringArrayProp, stringTempProp, trueProp, falseProp, stringProp);
            return NoContent();
        }
    }
  `);
});

it("Produces Accepted result for 202 response without body", async () => {
  const { startJobNoBody } = await runner.compile(t.code`
    model MyAcceptedNoBodyResponse { @statusCode statusCode: 202; }
    interface Svc {
      @route("/startnb") @post ${t.op("startJobNoBody")}(): MyAcceptedNoBodyResponse;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(startJobNoBody)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/startnb")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> StartJobNoBody()
        {
            await PetStoreImpl.StartJobNoBodyAsync();
            return Accepted();
        }
    }
  `);
});

it("Handles empty body 2xx as void", async () => {
  const { emptyOk } = await runner.compile(t.code`
    model OkEmpty { @statusCode statusCode: 200; }
    interface Svc {
      @route("/emptyok") @post ${t.op("emptyOk")}(): OkEmpty;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(emptyOk)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/emptyok")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> EmptyOk()
        {
            await PetStoreImpl.EmptyOkAsync();
            return NoContent();
        }
    }
  `);
});

it("emits correct code for GET requests with body parameters (body suppressed)", async () => {
  const { getWithBody } = await runner.compile(t.code`
    interface Svc {
      #suppress "@typespec/http-server-csharp/get-request-body" "test"
      @route("/foo") @get ${t.op("getWithBody")}(intProp?: int32): void;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(getWithBody)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpGet]
        [Route("/foo")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> GetWithBody()
        {
            await PetStoreImpl.GetWithBodyAsync();
            return NoContent();
        }
    }
  `);
});

it("emits correct code for GET requests with explicit body parameters (body suppressed)", async () => {
  const { getWithExplicitBody } = await runner.compile(t.code`
    interface Svc {
      #suppress "@typespec/http-server-csharp/anonymous-model" "test"
      #suppress "@typespec/http-server-csharp/get-request-body" "test"
      @route("/foo2") @get ${t.op("getWithExplicitBody")}(@body body?: { intProp?: int32 }): void;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction
        operation={canonicalizeOp(getWithExplicitBody)}
        implFieldName="PetStoreImpl"
      />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpGet]
        [Route("/foo2")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> GetWithExplicitBody()
        {
            await PetStoreImpl.GetWithExplicitBodyAsync();
            return NoContent();
        }
    }
  `);
});

it("Produces NoContent result for union of NoContent and error responses", async () => {
  const { ncOp } = await runner.compile(t.code`
    @error
    model NotFoundErrorResponse { @statusCode statusCode: 404; code: "not-found"; }
    interface Svc {
      @route("/nc") @post ${t.op("ncOp")}(): NoContentResponse | NotFoundErrorResponse;
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(ncOp)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        [HttpPost]
        [Route("/nc")]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public virtual async Task<IActionResult> NcOp()
        {
            await PetStoreImpl.NcOpAsync();
            return NoContent();
        }
    }
  `);
});

it("generates correct multiline jsdoc comments for operations", async () => {
  const { listPets } = await runner.compile(t.code`
    interface Svc {
      @route("/pets")
      /**
       * List Pet results
       * Provide top/skip or filter by name if needed
       */
      @get ${t.op("listPets")}(@query top?: int32 = 50, @query skip?: int32 = 0, @query nameFilter?: string = "*"): string[];
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(listPets)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        /// <summary>
        /// List Pet results
        /// Provide top/skip or filter by name if needed
        /// </summary>
        [HttpGet]
        [Route("/pets")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(string[]))]
        public virtual async Task<IActionResult> ListPets(
            [FromQuery(Name="top")]
            int? top,
            [FromQuery(Name="skip")]
            int? skip,
            [FromQuery(Name="nameFilter")]
            string? nameFilter
        )
        {
            var result = await PetStoreImpl.ListPetsAsync(top, skip, nameFilter);
            return Ok(result);
        }
    }
  `);
});

it("generates correct multiline jsdoc long comments for operations", async () => {
  const { listPetsLong } = await runner.compile(t.code`
    interface Svc {
      @route("/pets2")
      /**
       * A multiline comment.
       *   This line is indented.
       * This line is not
       * This line is quite long and likely should be broken into multiple lines as it goes on and on and on and on and doesn't stop ever, really it doesn't ever stop.  OK, it stops now.
       * https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html
       * and a line afterward.
       */
      @get ${t.op("listPetsLong")}(@query top?: string, @query skip?: string): string[];
    }
  `);

  expect(
    <Wrapper>
      <ControllerAction operation={canonicalizeOp(listPetsLong)} implFieldName="PetStoreImpl" />
    </Wrapper>,
  ).toRenderTo(`
    using Microsoft.AspNetCore.Mvc;

    class TestController
    {
        /// <summary>
        /// A multiline comment.
        /// This line is indented.
        /// This line is not
        /// This line is quite long and likely should be broken into multiple lines as it goes on and on and on and on and doesn't stop ever, really it doesn't ever stop.  OK, it stops now.
        /// <see href="https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html">https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html</see>
        /// and a line afterward.
        /// </summary>
        [HttpGet]
        [Route("/pets2")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(string[]))]
        public virtual async Task<IActionResult> ListPetsLong(
            [FromQuery(Name="top")]
            string? top,
            [FromQuery(Name="skip")]
            string? skip
        )
        {
            var result = await PetStoreImpl.ListPetsLongAsync(top, skip);
            return Ok(result);
        }
    }
  `);
});

it("Produces Accepted result for 202 response with body", async () => {
  const res = await runner.compile(t.code`
    model ${t.model("MyAcceptedResponse")} { @statusCode statusCode: 202; jobId: string; }
    interface Svc {
      @route("/start") @post ${t.op("startJob")}(): MyAcceptedResponse;
    }
  `);
  const op = canonicalizeOp(res.startJob);

  expect(
    <ModelAndAction
      modelType={res.MyAcceptedResponse}
      action={<ControllerAction operation={op} implFieldName="PetStoreImpl" />}
    />,
  ).toRenderTo({
    "Model.cs": `
      using System.Text.Json.Serialization;

      public partial class MyAcceptedResponse
      {
          [JsonPropertyName("statusCode")]
          public int StatusCode { get; } = 202;

          [JsonPropertyName("jobId")]
          public string JobId { get; set; }
      }
    `,
    "Controller.cs": `
      using Microsoft.AspNetCore.Mvc;

      class TestController
      {
          [HttpPost]
          [Route("/start")]
          [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MyAcceptedResponse))]
          public virtual async Task<IActionResult> StartJob()
          {
              var result = await PetStoreImpl.StartJobAsync();
              return Accepted(result);
          }
      }
    `,
  });
});

it("Produces StatusCode result for 201 response with body", async () => {
  const res = await runner.compile(t.code`
    model ${t.model("MyCreatedResponse")} { @statusCode statusCode: 201; id: string; }
    interface Svc {
      @route("/create") @post ${t.op("createResource")}(): MyCreatedResponse;
    }
  `);
  const op = canonicalizeOp(res.createResource);

  expect(
    <ModelAndAction
      modelType={res.MyCreatedResponse}
      action={<ControllerAction operation={op} implFieldName="PetStoreImpl" />}
    />,
  ).toRenderTo({
    "Model.cs": `
      using System.Text.Json.Serialization;

      public partial class MyCreatedResponse
      {
          [JsonPropertyName("statusCode")]
          public int StatusCode { get; } = 201;

          [JsonPropertyName("id")]
          public string Id { get; set; }
      }
    `,
    "Controller.cs": `
      using Microsoft.AspNetCore.Mvc;

      class TestController
      {
          [HttpPost]
          [Route("/create")]
          [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MyCreatedResponse))]
          public virtual async Task<IActionResult> CreateResource()
          {
              var result = await PetStoreImpl.CreateResourceAsync();
              return StatusCode(201, result);
          }
      }
    `,
  });
});

it("Handles bodyRoot parameters", async () => {
  const res = await runner.compile(t.code`
    model ${t.model("Widget")} { @path id: string; @query kind?: string; color: string; }
    interface Svc {
      @route("/widgets") @post ${t.op("createBodyRoot")}(@bodyRoot body: Widget): Widget;
    }
  `);
  const op = canonicalizeOp(res.createBodyRoot);

  expect(
    <ModelAndAction
      modelType={res.Widget}
      action={<ControllerAction operation={op} implFieldName="PetStoreImpl" />}
    />,
  ).toRenderTo({
    "Model.cs": `
      using System.Text.Json.Serialization;

      public partial class Widget
      {
          [JsonPropertyName("id")]
          public string Id { get; set; }

          [JsonPropertyName("kind")]
          public string Kind { get; set; }

          [JsonPropertyName("color")]
          public string Color { get; set; }
      }
    `,
    "Controller.cs": `
      using Microsoft.AspNetCore.Mvc;

      class TestController
      {
          [HttpPost]
          [Route("/widgets/{id}")]
          [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Widget))]
          public virtual async Task<IActionResult> CreateBodyRoot(Widget body)
          {
              var result = await PetStoreImpl.CreateBodyRootAsync(body);
              return Ok(result);
          }
      }
    `,
  });
});

it("Handles spread parameters", async () => {
  const res = await runner.compile(t.code`
    model ${t.model("Widget")} { @path id: string; @query kind?: string; color: string; }
    interface Svc {
      @route("/spread") @post ${t.op("createSpread")}(...Widget): Widget;
    }
  `);
  const op = canonicalizeOp(res.createSpread);

  expect(
    <ModelAndAction
      modelType={res.Widget}
      action={
        <ControllerAction
          operation={op}
          implFieldName="PetStoreImpl"
          requestModel={{ name: "SvcCreateSpreadRequest", op, ifaceName: "ISvc" } as any}
        />
      }
    />,
  ).toRenderTo({
    "Model.cs": `
      using System.Text.Json.Serialization;

      public partial class Widget
      {
          [JsonPropertyName("id")]
          public string Id { get; set; }

          [JsonPropertyName("kind")]
          public string Kind { get; set; }

          [JsonPropertyName("color")]
          public string Color { get; set; }
      }
    `,
    "Controller.cs": `
      using Microsoft.AspNetCore.Mvc;

      class TestController
      {
          [HttpPost]
          [Route("/spread/{id}")]
          [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Widget))]
          public virtual async Task<IActionResult> CreateSpread(
              string id,
              SvcCreateSpreadRequest body,
              [FromQuery(Name="kind")]
              string? kind
          )
          {
              var result = await PetStoreImpl.CreateSpreadAsync(id, body.Color, kind);
              return Ok(result);
          }
      }
    `,
  });
});

it("Handles void type in operations with a body parameter", async () => {
  const res = await runner.compile(t.code`
    model ${t.model("Toy")} { @key("toyId") id: int64; petId: int64; name: string; }
    interface Svc {
      @route("/voidbody") @post ${t.op("voidBody")}(@body body: Toy): void;
    }
  `);
  const op = canonicalizeOp(res.voidBody);

  expect(
    <ModelAndAction
      modelType={res.Toy}
      action={<ControllerAction operation={op} implFieldName="PetStoreImpl" />}
    />,
  ).toRenderTo({
    "Model.cs": `
      using System.Text.Json.Serialization;

      public partial class Toy
      {
          [JsonPropertyName("id")]
          public long Id { get; set; }

          [JsonPropertyName("petId")]
          public long PetId { get; set; }

          [JsonPropertyName("name")]
          public string Name { get; set; }
      }
    `,
    "Controller.cs": `
      using Microsoft.AspNetCore.Mvc;

      class TestController
      {
          [HttpPost]
          [Route("/voidbody")]
          [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
          public virtual async Task<IActionResult> VoidBody(
              [FromBody]
              Toy body
          )
          {
              await PetStoreImpl.VoidBodyAsync(body);
              return NoContent();
          }
      }
    `,
  });
});
