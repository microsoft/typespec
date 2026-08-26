import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputEnumType } from "../../src/type/input-type.js";
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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
    describe("With anonymous union enum response type", () => {
      it("should convert anonymous union enum response type to value type", async () => {
        const program = await typeSpecCompile(
          `
          @route("/test")
          op operationWithUnionEnumResponse(): "option1" | "option2" | string;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const [root] = createModel(sdkContext);

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

    describe("With named union enum response type", () => {
      it("should preserve the named enum response type", async () => {
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
        const [root] = createModel(sdkContext);

        strictEqual(root.clients.length, 1);
        strictEqual(root.clients[0].methods.length, 1);

        const method = root.clients[0].methods[0];
        ok(method);

        // validate service method response - named union enum is preserved as enum
        strictEqual(method.response.type?.kind, "enum");
        strictEqual((method.response.type as InputEnumType).name, "UnionEnumResponse");

        // validate operation response
        const operation = method.operation;
        ok(operation);
        strictEqual(operation.responses.length, 1);
        const response = operation.responses[0];
        ok(response);
        strictEqual(response.bodyType?.kind, "enum");
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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
        const [root] = createModel(sdkContext);

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
});

describe("Test isExactName propagation on operations and parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("propagates isExactName from @clientName decorator with exact() on a method parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@clientName(Azure.ClientGenerator.Core.exact("snake_case_param"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const methodParams = root.clients[0].methods[0].parameters;
    const param = methodParams.find((p) => p.name === "snake_case_param");
    ok(param);
    strictEqual(param.kind, "method");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a query parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@query @clientName(Azure.ClientGenerator.Core.exact("snake_case_query"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_query");
    ok(param);
    strictEqual(param.kind, "query");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a header parameter", async () => {
    const program = await typeSpecCompile(
      `
        op test(@header @clientName(Azure.ClientGenerator.Core.exact("snake_case_header"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_header");
    ok(param);
    strictEqual(param.kind, "header");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a path parameter", async () => {
    const program = await typeSpecCompile(
      `
        @route("/{regularName}")
        op test(@path @clientName(Azure.ClientGenerator.Core.exact("snake_case_path"), "csharp") regularName: string): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const params = root.clients[0].methods[0].operation.parameters;
    const param = params.find((p) => p.name === "snake_case_path");
    ok(param);
    strictEqual(param.kind, "path");
    strictEqual(param.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on a body parameter", async () => {
    const program = await typeSpecCompile(
      `
        model Book {
          name: string;
        }
        op test(@body @clientName(Azure.ClientGenerator.Core.exact("snake_case_body"), "csharp") regularName: Book): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const bodyParam = root.clients[0].methods[0].operation.parameters.find(
      (p) => p.name === "snake_case_body",
    );
    ok(bodyParam);
    strictEqual(bodyParam.kind, "body");
    strictEqual(bodyParam.isExactName, true);
  });

  it("propagates isExactName from @clientName decorator with exact() on an operation", async () => {
    const program = await typeSpecCompile(
      `
        @clientName(Azure.ClientGenerator.Core.exact("snake_case_op"), "csharp")
        op test(): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const method = root.clients[0].methods.find((m) => m.name === "snake_case_op");
    ok(method);
    strictEqual(method.isExactName, true);
    strictEqual(method.operation.name, "snake_case_op");
    strictEqual(method.operation.isExactName, true);
  });
});

describe("Multipart convenience method generation", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("disables convenience method for multipart/mixed and reports a diagnostic", async () => {
    const program = await typeSpecCompile(
      `
        model MultipartRequest {
          id: HttpPart<string>;
          profileImage: HttpPart<File>;
        }

        @post
        @route("/upload")
        op upload(
          @header contentType: "multipart/mixed",
          @multipartBody body: MultipartRequest,
        ): NoContentResponse;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, diagnostics] = createModel(sdkContext);

    const operation = root.clients[0].methods[0].operation;
    ok(operation);
    ok(operation.requestMediaTypes?.includes("multipart/mixed"));
    // Protocol methods are still generated, but convenience methods are turned off.
    strictEqual(operation.generateProtocolMethod, true);
    strictEqual(operation.generateConvenienceMethod, false);

    const diagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-multipart-convenience-method",
    );
    ok(diagnostic);
    strictEqual(diagnostic.severity, "warning");
  });

  it("keeps convenience method for multipart/form-data without a diagnostic", async () => {
    const program = await typeSpecCompile(
      `
        model MultipartRequest {
          profileImage: HttpPart<File>;
        }

        @post
        @route("/upload")
        op upload(
          @header contentType: "multipart/form-data",
          @multipartBody body: MultipartRequest,
        ): NoContentResponse;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, diagnostics] = createModel(sdkContext);

    const operation = root.clients[0].methods[0].operation;
    ok(operation);
    ok(operation.requestMediaTypes?.includes("multipart/form-data"));
    strictEqual(operation.generateConvenienceMethod, true);

    const diagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-multipart-convenience-method",
    );
    strictEqual(diagnostic, undefined);
  });
});
