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

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].operations.length, 1);

        const operation = root.clients[0].operations[0];
        ok(operation);
        strictEqual(operation.parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.name, "contentType");
        strictEqual(contentTypeParam.type.kind, "constant");
        strictEqual(undefined, contentTypeParam.sourceModel);

        // body parameter
        const bodyParam = operation.parameters.find((p) => p.name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.type.kind, "model");
        strictEqual(undefined, bodyParam.sourceModel);

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        ok(headerParam.sourceModel);

        // header parameter in service method
        const headerParam2 = operation.parameters.find((p) => p.name === "p1");
        ok(headerParam2);
        strictEqual(headerParam2.type.kind, "string");
        strictEqual(undefined, headerParam2.sourceModel);
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

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].operations.length, 1);

        const operation = root.clients[0].operations[0];
        ok(operation);

        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);

        // validate headers
        strictEqual(response.headers.length, 1);
        strictEqual(response.headers[0].name, "foo");
        strictEqual(response.headers[0].type.kind, "string");

        // validate response body
        strictEqual(response.bodyType?.kind, "model");

        // validate model properties
        const body = response.bodyType;
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
