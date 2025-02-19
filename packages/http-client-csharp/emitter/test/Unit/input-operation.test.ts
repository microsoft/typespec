import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputModelPropertyKind } from "../../src/type/input-model-property-kind.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test Operation", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("Operation with header parameters", () => {
    describe("With header in request model", () => {
      it("Header parameter in model should be flagged as not present in service method", async () => {
        const program = await typeSpecCompile(
          `
            model HeaderModel {
                @header("x-foo")
                foo: string;
    
                bar: int32;
            }
    
            op testOperation(@header p1: string, @bodyRoot options: HeaderModel): void;
            `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.Clients.length, 1);
        strictEqual(root.Clients[0].Operations.length, 1);

        const operation = root.Clients[0].Operations[0];
        ok(operation);
        strictEqual(operation.Parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.Parameters.find((p) => p.Name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.Name, "contentType");
        strictEqual(contentTypeParam.Type.kind, "constant");
        strictEqual(undefined, contentTypeParam.SourceModel);

        // body parameter
        const bodyParam = operation.Parameters.find((p) => p.Name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.Type.kind, "model");
        strictEqual(undefined, bodyParam.SourceModel);

        // header parameter in request model
        const headerParam = operation.Parameters.find((p) => p.Name === "foo");
        ok(headerParam);
        strictEqual(headerParam.Type.kind, "string");
        ok(headerParam.SourceModel);

        // header parameter in service method
        const headerParam2 = operation.Parameters.find((p) => p.Name === "p1");
        ok(headerParam2);
        strictEqual(headerParam2.Type.kind, "string");
        strictEqual(undefined, headerParam2.SourceModel);
      });
    });
  });

  describe("Operation with response headers", () => {
    describe("With header in response model", () => {
      it("should have a response body type of model with the header as a property", async () => {
        const program = await typeSpecCompile(
          `
          model ModelWithHeaderInResponse {
  
          @header("x-foo")
          foo: string;
  
          bar: int32;
      }
  
      @route("/test")
      op operationWithResponse(): ModelWithHeaderInResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.Clients.length, 1);
        strictEqual(root.Clients[0].Operations.length, 1);

        const operation = root.Clients[0].Operations[0];
        ok(operation);

        strictEqual(operation.Responses.length, 1);
        const response = operation.Responses[0];
        ok(response);

        // validate headers
        strictEqual(response.Headers.length, 1);
        strictEqual(response.Headers[0].Name, "foo");
        strictEqual(response.Headers[0].Type.kind, "string");

        // validate response body
        strictEqual(response.BodyType?.kind, "model");

        // validate model properties
        const body = response.BodyType;
        ok(body);
        // header property
        strictEqual(body.properties.length, 2);
        strictEqual(body.properties[0].name, "foo");
        strictEqual(body.properties[0].type.kind, "string");
        strictEqual(body.properties[0].kind, InputModelPropertyKind.Header);
        // body property
        strictEqual(body.properties[1].name, "bar");
        strictEqual(body.properties[1].type.kind, "int32");
        strictEqual(body.properties[1].kind, InputModelPropertyKind.Property);
      });
    });
  });
});
