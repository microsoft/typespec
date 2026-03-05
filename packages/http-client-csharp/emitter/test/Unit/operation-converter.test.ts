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
        strictEqual(bodyParam.kind, "body");

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.kind, "header");

        // header parameter in service method
        const headerParam2 = operation.parameters.find((p) => p.name === "p1");
        ok(headerParam2);
        strictEqual(headerParam2.type.kind, "string");
        strictEqual(headerParam2.kind, "header");
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
        strictEqual(bodyParam.kind, "body");

        // header parameter in request model
        const headerParam = operation.parameters.find((p) => p.name === "foo");
        ok(headerParam);
        strictEqual(headerParam.type.kind, "string");
        strictEqual(headerParam.kind, "query");
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
        strictEqual(response.headers[0].nameInResponse, "x-foo");
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
        strictEqual(body.properties[0].kind, "property");
        // body property
        strictEqual(body.properties[1].name, "bar");
        strictEqual(body.properties[1].type.kind, "int32");
        strictEqual(body.properties[1].kind, "property");
      });
    });
  });

  describe("Operation response type conversion", () => {
    describe("With union enum response type", () => {
      it("should convert union enum response type to value type", async () => {
        const program = await typeSpecCompile(
          `
          union UnionEnumResponse {
            value1: "option1",
            value2: "option2",
            stringValue: string,
          }

          @route("/test")
          op operationWithUnionEnumResponse(): UnionEnumResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type?.kind, "string");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "string");
      });
    });

    describe("With union model response type", () => {
      it("should use union response type", async () => {
        const program = await typeSpecCompile(
          `
          model ServerEventSessionAvatarConnecting {
            server_sdp: string;
          }

          model ServerEventSessionCreated {
            session: string;
          }

          alias ForceModelServerEvent =
            ServerEventSessionAvatarConnecting |
            ServerEventSessionCreated;

          @route("foo")
          op force_models(): ForceModelServerEvent;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        const responseType = method.response.type;
        ok(responseType);
        strictEqual(responseType.kind, "union");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "union");
      });
    });

    describe("With regular enum response type", () => {
      it("should convert regular enum response type normally", async () => {
        const program = await typeSpecCompile(
          `
          enum RegularEnumResponse {
            value1: "option1",
            value2: "option2",
          }

          @route("/test")
          op operationWithRegularEnumResponse(): RegularEnumResponse;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type?.kind, "enum");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "enum");
      });
    });

    describe("With undefined response type", () => {
      it("should handle undefined response type", async () => {
        const program = await typeSpecCompile(
          `
          @route("/test")
          op operationWithVoidResponse(): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response
        strictEqual(method.response.type, undefined);

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType, undefined);
      });
    });

    describe("Optional Content-Type header", () => {
      it("Optional body should have Content-Type remain as Constant (not transformed to enum)", async () => {
        const program = await typeSpecCompile(
          `
          model BodyModel {
            name: string;
          }
          
          @post
          op withOptionalBody(@body body?: BodyModel): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        const contentTypeMethodParam = method.parameters.find((p) => p.name === "contentType");
        ok(contentTypeMethodParam, "Content-Type parameter should exist in service method");
        strictEqual(
          contentTypeMethodParam.type.kind,
          "constant",
          "Content-type should remain a constant type, not transformed to enum",
        );

        // validate operation
        const operation = method.operation;
        ok(operation);

        // Find Content-Type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam, "Content-Type parameter should exist");
        strictEqual(contentTypeParam.kind, "header");
        strictEqual(contentTypeParam.serializedName, "Content-Type");
        strictEqual(contentTypeParam.optional, true, "Content-Type should be optional");
        strictEqual(
          contentTypeParam.scope,
          "Constant",
          "Content-Type should remain Constant scope",
        );
        strictEqual(
          contentTypeParam.type.kind,
          "constant",
          "Content-Type should remain a constant type, not transformed to enum",
        );
      });

      it("Required body should have Content-Type with Constant scope", async () => {
        const program = await typeSpecCompile(
          `
          model BodyModel {
            name: string;
          }
          
          @post
          op withRequiredBody(@body body: BodyModel): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate operation
        const operation = method.operation;
        ok(operation);

        // Find Content-Type parameter
        const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
        ok(contentTypeParam, "Content-Type parameter should exist");
        strictEqual(contentTypeParam.kind, "header");
        strictEqual(contentTypeParam.serializedName, "Content-Type");
        strictEqual(contentTypeParam.optional, false, "Content-Type should be required");
        strictEqual(
          contentTypeParam.scope,
          "Constant",
          "Content-Type should have Constant scope for required body",
        );
        strictEqual(
          contentTypeParam.type.kind,
          "constant",
          "Content-Type should be a constant type",
        );
      });
    });
  });

  describe("includeRootSlash client option", () => {
    it("should strip leading slash from operation path when includeRootSlash is false on client", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          interface MyClient {
            @route("?restype=container")
            op getContainer(): void;
          }
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const myClient = root.clients[0].children?.find((c) => c.name === "MyClient");
      ok(myClient);
      const operation = myClient.methods[0].operation;
      strictEqual(operation.path, "?restype=container");
    });

    it("should keep leading slash when includeRootSlash is not set (default)", async () => {
      const program = await typeSpecCompile(
        `
          @route("/foo/bar")
          op test(): void;
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      strictEqual(operation.path, "/foo/bar");
    });

    it("should strip leading slash from operation path when includeRootSlash is false on operation", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          @route("/foo/bar")
          op test(): void;
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      strictEqual(operation.path, "foo/bar");
    });

    it("should allow sub-client to override parent client includeRootSlash option", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          @route("/root")
          interface ParentClient {
            @route("/parent-op")
            op parentOp(): void;
          }

          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", true, "csharp")
          @route("/child")
          interface ChildClient {
            @route("/child-op")
            op childOp(): void;
          }
        `,
        runner,
        { IsTCGCNeeded: true, IsNamespaceNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      // Parent client operations should have no leading slash
      const parentClient = root.clients[0].children?.find((c) => c.name === "ParentClient");
      ok(parentClient);
      const parentOp = parentClient.methods[0].operation;
      strictEqual(parentOp.path, "root/parent-op");

      // Child client operations should keep leading slash (override)
      const childClient = root.clients[0].children?.find((c) => c.name === "ChildClient");
      ok(childClient);
      const childOp = childClient.methods[0].operation;
      strictEqual(childOp.path, "/child/child-op");
    });

    it("should allow operation to override client includeRootSlash option", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          interface MyClient {
            @route("/op1")
            op op1(): void;

            #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
            @clientOption("includeRootSlash", true, "csharp")
            @route("/op2")
            op op2(): void;
          }
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const myClient = root.clients[0].children?.find((c) => c.name === "MyClient");
      ok(myClient);

      // op1 should inherit client's includeRootSlash=false
      const op1 = myClient.methods.find((m) => m.name === "op1");
      ok(op1);
      strictEqual(op1.operation.path, "op1");

      // op2 should override with includeRootSlash=true
      const op2 = myClient.methods.find((m) => m.name === "op2");
      ok(op2);
      strictEqual(op2.operation.path, "/op2");
    });

    it("should inherit includeRootSlash from parent client when sub-client does not set it", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          @service(#{
            title: "Test Service",
          })
          namespace TestService;

          @route("/sub")
          interface SubClient {
            @route("/sub-op")
            op subOp(): void;
          }
        `,
        runner,
        { IsTCGCNeeded: true, IsNamespaceNeeded: false },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      // Root client has includeRootSlash=false, sub-client inherits
      const subClient = root.clients[0].children?.find((c) => c.name === "SubClient");
      ok(subClient);
      const subOp = subClient.methods[0].operation;
      strictEqual(subOp.path, "sub/sub-op");
    });

    it("should handle multiple sub-clients with different includeRootSlash values per operation", async () => {
      const program = await typeSpecCompile(
        `
          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", false, "csharp")
          interface BlobClient {
            @route("/list")
            op list(): void;

            #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
            @clientOption("includeRootSlash", true, "csharp")
            @route("/get")
            op get(): void;

            @route("/delete")
            op delete(): void;
          }

          #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
          @clientOption("includeRootSlash", true, "csharp")
          interface ContainerClient {
            @route("/create")
            op create(): void;

            #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
            @clientOption("includeRootSlash", false, "csharp")
            @route("/remove")
            op remove(): void;

            @route("/info")
            op info(): void;
          }

          interface DefaultClient {
            @route("/ping")
            op ping(): void;

            #suppress "@azure-tools/typespec-client-generator-core/client-option" "test"
            @clientOption("includeRootSlash", false, "csharp")
            @route("/status")
            op status(): void;
          }
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      // BlobClient: client-level includeRootSlash=false
      const blobClient = root.clients[0].children?.find((c) => c.name === "BlobClient");
      ok(blobClient);

      const listOp = blobClient.methods.find((m) => m.name === "list");
      ok(listOp);
      strictEqual(listOp.operation.path, "list");

      const getOp = blobClient.methods.find((m) => m.name === "get");
      ok(getOp);
      strictEqual(getOp.operation.path, "/get");

      const deleteOp = blobClient.methods.find((m) => m.name === "delete");
      ok(deleteOp);
      strictEqual(deleteOp.operation.path, "delete");

      // ContainerClient: client-level includeRootSlash=true
      const containerClient = root.clients[0].children?.find(
        (c) => c.name === "ContainerClient",
      );
      ok(containerClient);

      const createOp = containerClient.methods.find((m) => m.name === "create");
      ok(createOp);
      strictEqual(createOp.operation.path, "/create");

      const removeOp = containerClient.methods.find((m) => m.name === "remove");
      ok(removeOp);
      strictEqual(removeOp.operation.path, "remove");

      const infoOp = containerClient.methods.find((m) => m.name === "info");
      ok(infoOp);
      strictEqual(infoOp.operation.path, "/info");

      // DefaultClient: no client-level option (default includeRootSlash=true)
      const defaultClient = root.clients[0].children?.find((c) => c.name === "DefaultClient");
      ok(defaultClient);

      const pingOp = defaultClient.methods.find((m) => m.name === "ping");
      ok(pingOp);
      strictEqual(pingOp.operation.path, "/ping");

      const statusOp = defaultClient.methods.find((m) => m.name === "status");
      ok(statusOp);
      strictEqual(statusOp.operation.path, "status");
    });
  });
});
