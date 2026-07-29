import type { Model, Union } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import type { HttpOperationResponse } from "../src/index.js";
import { compileOperations, getOperationsWithServiceNamespace } from "./test-host.js";

async function getResponses(code: string): Promise<HttpOperationResponse[]> {
  const [routes, diagnostics] = await getOperationsWithServiceNamespace(code);
  expectDiagnosticEmpty(diagnostics);
  expect(routes).toHaveLength(1);
  return routes[0].responses;
}

describe("body resolution", () => {
  it("emit diagnostics for duplicate @body decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @body body1: string, @body body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("emit diagnostics for duplicate @bodyRoot decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @bodyRoot body1: string, @bodyRoot body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("emit diagnostics for using @body and @bodyRoute decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @bodyRoot body1: string, @body body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("allows a deeply nested @body", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): {data: {nested: { @body param2: string }}};
      `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("allows a deeply nested @bodyRoot", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): {data: {nested: { @bodyRoot param2: string }}};
      `);

    expectDiagnosticEmpty(diagnostics);
  });

  describe("emit diagnostics when using metadata decorator in @body", () => {
    it.each([
      ["@header", "id: string"],
      ["@statusCode", "_: 200"],
    ])("%s", async (dec, prop) => {
      const [_, diagnostics] = await compileOperations(
        `op read(): { @body explicit: {${dec} ${prop}, other: string} };`,
      );
      expectDiagnostics(diagnostics, { code: "@typespec/http/metadata-ignored" });
    });
  });
});

describe("response cookie", () => {
  it("emit diagnostics for implicit @cookie in the response", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): { @cookie token: string };
      `);

    expectDiagnostics(diagnostics, { code: "@typespec/http/response-cookie-not-supported" });
  });

  it("doesn't emit response-cookie-not-supported diagnostics for explicit @cookie in the response", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): { @body explicit: { @cookie token: string } };
      `);

    expectDiagnostics(diagnostics, { code: "@typespec/http/metadata-ignored" });
  });
});

it("doesn't emit diagnostic if the metadata is not applicable in the response", async () => {
  const [_, diagnostics] = await compileOperations(
    `op read(): { @body explicit: {@path id: string} };`,
  );
  expectDiagnosticEmpty(diagnostics);
});

it("issues diagnostics for invalid content types", async () => {
  const [_, diagnostics] = await compileOperations(
    `
      model Foo {
        foo: string;
      }

      model TextPlain {
        contentType: "text/plain";
      }

      @route("/test1")
      @get
      op test1(): { @header contentType: int32, @body body: Foo };
      @route("/test2")
      @get
      op test2(): { @header contentType: 42, @body body: Foo };
      @route("/test3")
      @get
      op test3(): { @header contentType: "application/json" | TextPlain, @body body: Foo };
    `,
  );
  expectDiagnostics(diagnostics, [
    { code: "@typespec/http/content-type-string" },
    { code: "@typespec/http/content-type-string" },
    { code: "@typespec/http/content-type-string" },
  ]);
});

it("supports any casing for string literal 'Content-Type' header properties.", async () => {
  const [routes, diagnostics] = await getOperationsWithServiceNamespace(
    `
      model Foo {}

      @route("/test1")
      op test1(): { @header "content-Type": "text/html", @body body: Foo };

      @route("/test2")
      op test2(): { @header "CONTENT-type": "text/plain", @body body: Foo };

      @route("/test3")
      op test3(): { @header "content-type": "application/json", @body body: Foo };
    `,
  );
  expectDiagnosticEmpty(diagnostics);
  strictEqual(routes.length, 3);
  deepStrictEqual(routes[0].responses[0].responses[0].body?.contentTypes, ["text/html"]);
  deepStrictEqual(routes[1].responses[0].responses[0].body?.contentTypes, ["text/plain"]);
  deepStrictEqual(routes[2].responses[0].responses[0].body?.contentTypes, ["application/json"]);
});

it("treats content-type as a header for HEAD responses", async () => {
  const responses = await getResponses(`
    @head
    op head(): { @header "content-type": "text/plain" };
  `);
  const response = responses[0].responses[0];
  expect(response.body).toBeUndefined();
  ok(response.headers);
  expect(Object.keys(response.headers)).toEqual(["content-type"]);
});

// Regression test for https://github.com/microsoft/typespec/issues/328
it("empty response model becomes body if it has children", async () => {
  const responses = await getResponses(`
    op read(): A;

    @discriminator("foo")
    model A {}

    model B extends A {
      foo: "B";
      b: string;
    }

    model C extends A {
      foo: "C";
      c: string;
    }
  `);
  expect(responses).toHaveLength(1);
  const body = responses[0].responses[0].body;
  ok(body);
  expect((body.type as Model).name).toBe("A");
});

it("chooses correct content-type for extensible union body", async () => {
  const responses = await getResponses(`
    union DaysOfWeekExtensibleEnum {
      string,

      @doc("Monday.")
      Monday: "Monday",

      @doc("Tuesday.")
      Tuesday: "Tuesday",

      @doc("Wednesday.")
      Wednesday: "Wednesday",

      @doc("Thursday.")
      Thursday: "Thursday",

      @doc("Friday.")
      Friday: "Friday",

      @doc("Saturday.")
      Saturday: "Saturday",

      @doc("Sunday.")
      Sunday: "Sunday",
    }

    @get
    @route("/unknown-value")
    op getUnknownValue(): {
      @body body: DaysOfWeekExtensibleEnum;
    };
  `);
  expect(responses).toHaveLength(1);
  const body = responses[0].responses[0].body;
  ok(body);
  expect(body.contentTypes).toEqual(["text/plain"]);
});

describe("status code", () => {
  async function getResponse(code: string) {
    const [routes, diagnostics] = await getOperationsWithServiceNamespace(code);
    expectDiagnosticEmpty(diagnostics);
    expect(routes).toHaveLength(1);
    expect(routes[0].responses).toHaveLength(1);
    return routes[0].responses[0];
  }

  it("resolve from a property at the root", async () => {
    const response = await getResponse(`op test1(): { @statusCode code: 201 };`);
    expect(response.statusCodes).toEqual(201);
  });

  it("resolve from a property nested", async () => {
    const response = await getResponse(`op test1(): { nested: { @statusCode code: 201 } };`);
    expect(response.statusCodes).toEqual(201);
  });

  it("resolve from parent model with no local props", async () => {
    const response = await getResponse(`
      model Created { @statusCode code: 201 }
      model Res extends Created {};
      op test1(): Res;
    `);
    expect(response.statusCodes).toEqual(201);
  });
});

describe("union of unannotated return types", () => {
  it("groups plain model variants into a single union response", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      model Dog { bark: boolean }
      op get(): Cat | Dog;
    `);
    expect(responses).toHaveLength(1);
    expect(responses[0].statusCodes).toBe(200);
    const body = responses[0].responses[0].body;
    ok(body);
    expect(body.type.kind).toBe("Union");
    expect((body.type as Union).variants.size).toBe(2);
  });

  it("preserves the original named union when all variants are plain bodies", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      model Dog { bark: boolean }
      union Pet { cat: Cat, dog: Dog }
      op get(): Pet;
    `);
    expect(responses).toHaveLength(1);
    const body = responses[0].responses[0].body;
    ok(body);
    expect(body.type.kind).toBe("Union");
    expect((body.type as Union).name).toBe("Pet");
  });

  it("keeps response envelope variants separate from plain body variants", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      model Dog { bark: boolean }
      model NotFoundResponse { @statusCode code: 404; message: string }
      op get(): Cat | Dog | NotFoundResponse;
    `);
    expect(responses).toHaveLength(2);

    const okResponse = responses.find((r) => r.statusCodes === 200);
    ok(okResponse);
    const okBody = okResponse.responses[0].body;
    ok(okBody);
    expect(okBody.type.kind).toBe("Union");
    expect((okBody.type as Union).variants.size).toBe(2);

    expect(responses.find((r) => r.statusCodes === 404)).toBeDefined();
  });

  it("handles nested union mixing plain bodies and response envelopes", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      model Dog { bark: boolean }
      model NotFoundResponse { @statusCode code: 404; message: string }
      union CatOrNotFound { cat: Cat, notFound: NotFoundResponse }
      op get(): CatOrNotFound | Dog;
    `);
    expect(responses).toHaveLength(2);

    const okResponse = responses.find((r) => r.statusCodes === 200);
    ok(okResponse);
    const okBody = okResponse.responses[0].body;
    ok(okBody);
    expect(okBody.type.kind).toBe("Union");
    expect((okBody.type as Union).variants.size).toBe(2);

    expect(responses.find((r) => r.statusCodes === 404)).toBeDefined();
  });

  it("handles union with Error model variants as separate responses", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      @error model MyError { @statusCode code: 500; message: string }
      op get(): Cat | MyError;
    `);
    expect(responses).toHaveLength(2);

    const okResponse = responses.find((r) => r.statusCodes === 200);
    ok(okResponse);
    expect((okResponse.responses[0].body?.type as Model).name).toBe("Cat");

    expect(responses.find((r) => r.statusCodes === 500)).toBeDefined();
  });

  it("handles union with void variant by skipping it", async () => {
    const responses = await getResponses(`
      model Cat { meow: boolean }
      op get(): Cat | void;
    `);
    expect(responses.length).toBeGreaterThanOrEqual(1);
  });

  it("treats discriminated union as a single body type (not expanded)", async () => {
    const responses = await getResponses(`
      @discriminated
      union Pet { cat: Cat, dog: Dog }
      model Cat { kind: "cat"; meow: boolean }
      model Dog { kind: "dog"; bark: boolean }
      op get(): Pet;
    `);
    expect(responses).toHaveLength(1);
    expect(responses[0].statusCodes).toBe(200);
    const body = responses[0].responses[0].body;
    ok(body);
    expect(body.type.kind).toBe("Union");
    expect((body.type as Union).name).toBe("Pet");
  });
});
