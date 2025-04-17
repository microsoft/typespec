import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { RequestLocation } from "../../src/type/request-location.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Operation Converter", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("Operation with embedded non-body parameters in request body", () => {
    describe("With header in request model", () => {
      it("Header parameter in model should not be present in service method", async () => {
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
        strictEqual(root.clients[0].methods.length, 1);

        // validate service method
        const method = root.clients[0].methods[0];
        ok(method);
        strictEqual(method.parameters.length, 3);

        const p1 = method.parameters.find((p) => p.name === "p1");
        ok(p1);
        strictEqual(p1.location, RequestLocation.Header);

        const headerModel = method.parameters.find((p) => p.name === "options");
        ok(headerModel);
        strictEqual(headerModel.location, RequestLocation.Body);
        strictEqual(headerModel.type.kind, "model");
        strictEqual(headerModel.type.name, "HeaderModel");

        const fooParam = method.parameters.find((p) => p.name === "foo");
        strictEqual(fooParam, undefined);

        // validate operation
        const operation = root.clients[0].methods[0].operation;
        ok(operation);
        strictEqual(operation.parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.name, "contentType");
        strictEqual(contentTypeParam.type.kind, "constant");

        // body parameter
        const bodyParam = operation.parameters.find((p) => p.name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.type.kind, "model");
        strictEqual(bodyParam.location, RequestLocation.Body);

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.location, RequestLocation.Header);

        // header parameter in service method
        const headerParam2 = operation.parameters.find((p) => p.name === "p1");
        ok(headerParam2);
        strictEqual(headerParam2.type.kind, "string");
        strictEqual(headerParam2.location, RequestLocation.Header);
      });
    });

    describe("With query in request model", () => {
      it("Query parameter in model should not be present in service method", async () => {
        const program = await typeSpecCompile(
          `
            model HeaderModel {
                @query("x-foo")
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
        strictEqual(root.clients[0].methods.length, 1);

        // validate service method
        const method = root.clients[0].methods[0];
        ok(method);
        strictEqual(method.parameters.length, 3);

        const p1 = method.parameters.find((p) => p.name === "p1");
        ok(p1);
        strictEqual(p1.location, RequestLocation.Header);

        const headerModel = method.parameters.find((p) => p.name === "options");
        ok(headerModel);
        strictEqual(headerModel.location, RequestLocation.Body);
        strictEqual(headerModel.type.kind, "model");
        strictEqual(headerModel.type.name, "HeaderModel");

        // header parameter in service method
        const fooParam = method.parameters.find((p) => p.name === "foo");
        strictEqual(fooParam, undefined);

        // validate operation
        const operation = root.clients[0].methods[0].operation;
        ok(operation);
        strictEqual(operation.parameters.length, 4);

        // content type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam);
        strictEqual(contentTypeParam.name, "contentType");
        strictEqual(contentTypeParam.type.kind, "constant");

        // body parameter
        const bodyParam = operation.parameters.find((p) => p.name === "options");
        ok(bodyParam);
        strictEqual(bodyParam.type.kind, "model");
        strictEqual(bodyParam.location, RequestLocation.Body);

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.location, RequestLocation.Query);
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
        strictEqual(root.clients[0].methods.length, 1);

        const operation = root.clients[0].methods[0].operation;
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
        strictEqual(body.properties[0].kind, "header");
        // body property
        strictEqual(body.properties[1].name, "bar");
        strictEqual(body.properties[1].type.kind, "int32");
        strictEqual(body.properties[1].kind, "property");
      });
    });
  });
});
