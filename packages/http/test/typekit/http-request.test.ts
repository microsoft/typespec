import type { Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import "../../src/experimental/typekit/index.js";
import { Tester } from "./../test-host.js";

describe("HttpRequest Body Parameters", () => {
  it("should handle model is array response", async () => {
    const { program, get } = await Tester.compile(t.code`
      model EmbeddingVector<Element extends numeric = float32> is Array<Element>;

      op ${t.op("get")}(): EmbeddingVector<int32>;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(get);
    const body = tk.httpOperation.getReturnType(httpOperation)!;
    expect(body).toBeDefined();
    expect(tk.model.is(body)).toBe(true);
    expect(tk.array.is(body)).toBe(true);
    expect(tk.array.getElementType(body as Model)).toBe(tk.builtin.int32);
  });

  it("should get the body parameters model when spread", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @post
      @test op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    expect(body).toBeDefined();
    expect(tk.model.is(body)).toBe(true);
    expect(tk.model.isExpresion(body as Model)).toBe(true);
    expect((body as Model).properties.size).toBe(3);
  });

  it("should get the body model params when body is defined explicitly as a property", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @route("/foo")
      @post
      op ${t.op("createFoo")}(@body foo: int32): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    expect(body).toBeDefined();
    expect(tk.model.is(body)).toBe(true);
    expect(tk.model.isExpresion(body)).toBe(true);
    expect(body.properties.size).toBe(1);
    expect(body.properties.get("foo")!.name).toBe("foo");
  });

  it("should get the body when spread and nested", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @path id: int32;
         age: int32;
         name: string;
         options: {
           @path token: string;
           subProp: string;
         }
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    expect(body).toBeDefined();
    expect((body as Model).properties.size).toBe(3);
    const properties = Array.from(body.properties.values())
      .map((p) => p.name)
      .join(",");
    expect(properties).toBe("age,name,options");

    const optionsParam = (body as Model).properties.get("options")!.type as Model;
    const optionsProps = Array.from(optionsParam.properties.values())
      .map((p) => p.name)
      .join(",");

    // TODO: Why do we get the path property token here?
    expect(optionsProps).toEqual("token,subProp");
  });

  it("should get the body when named body model", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(@body foo: Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    expect(body).toBeDefined();
    expect(tk.model.is(body)).toBe(true);
    // Should have a single property called foo
    expect(body.properties.size).toBe(1);
    expect((body.properties.get("foo")?.type as Model).name).toBe("Foo");
  });

  it("should get the named body body when combined", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @path id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(foo: Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    expect(body).toBeDefined();
    expect(tk.model.is(body)).toBe(true);
    // foo is a positional parameter to the operation, but not the body itself so the body model is anonymous with a single property "foo"
    expect(tk.model.isExpresion(body as Model)).toBe(true);
    expect((body as Model).properties.size).toBe(1);
    expect(((body as Model).properties.get("foo")?.type as any).name).toBe("Foo");
  });
});

describe("HttpRequest Get Parameters", () => {
  it("should only have body parameters", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)!;
    const headers = tk.httpRequest.getParameters(httpOperation, "header");
    const path = tk.httpRequest.getParameters(httpOperation, "path");
    const query = tk.httpRequest.getParameters(httpOperation, "query");
    expect(body).toBeDefined();
    expect(headers).toBeUndefined();
    expect(path).toBeUndefined();
    expect(query).toBeUndefined();
  });

  it("should be able to get parameter options", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
        @path(#{allowReserved: true}) id: string;
        @header(#{explode: true}) requestId: string[];
        @query(#{explode: true}) data: string[];
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const headers = tk.httpRequest.getParameters(httpOperation, "header");
    const path = tk.httpRequest.getParameters(httpOperation, "path");
    const query = tk.httpRequest.getParameters(httpOperation, "query");

    const requestIdProperty = headers!.properties.get("requestId");
    const idProperty = path!.properties.get("id");
    const dataProperty = query!.properties.get("data");

    expect(tk.modelProperty.getHttpHeaderOptions(requestIdProperty!)).toStrictEqual({
      explode: true,
      name: "request-id",
      type: "header",
    });

    expect(tk.modelProperty.getHttpPathOptions(idProperty!)).toStrictEqual({
      allowReserved: true,
      explode: false,
      name: "id",
      style: "simple",
      type: "path",
    });

    expect(tk.modelProperty.getHttpQueryOptions(dataProperty!)).toStrictEqual({
      explode: true,
      name: "data",
      type: "query",
    });
  });

  it("should only have header parameters", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @path id: int32;
         age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)! as Model;
    const headers = tk.httpRequest.getParameters(httpOperation, "header");
    const path = tk.httpRequest.getParameters(httpOperation, "path")!;
    const query = tk.httpRequest.getParameters(httpOperation, "query");
    expect(body).toBeDefined();
    expect(body.properties.size).toBe(2);
    expect(path).toBeDefined();
    expect(path.properties.size).toBe(1);
    expect(path.properties.get("id")?.name).toBe("id");
    expect(headers).toBeUndefined();
    expect(query).toBeUndefined();
  });

  it("should only have path parameters", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @header id: int32;
         @header age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)! as Model;
    const headers = tk.httpRequest.getParameters(httpOperation, "header")!;
    const path = tk.httpRequest.getParameters(httpOperation, "path");
    const query = tk.httpRequest.getParameters(httpOperation, "query");
    expect(body).toBeDefined();
    expect(body.properties.size).toBe(1);
    expect(headers).toBeDefined();
    expect(headers.properties.size).toBe(2);
    expect(headers.properties.get("id")?.name).toBe("id");
    expect(headers.properties.get("age")?.name).toBe("age");
    expect(path).toBeUndefined();
    expect(query).toBeUndefined();
  });

  it("should only have query parameters", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @query id: int32;
         @query age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const body = tk.httpRequest.getBodyParameters(httpOperation)! as Model;
    const headers = tk.httpRequest.getParameters(httpOperation, "header");
    const path = tk.httpRequest.getParameters(httpOperation, "path");
    const query = tk.httpRequest.getParameters(httpOperation, "query")!;
    expect(body).toBeDefined();
    expect(body.properties.size).toBe(1);
    expect(query).toBeDefined();
    expect(query.properties.size).toBe(2);
    expect(query.properties.get("id")?.name).toBe("id");
    expect(query.properties.get("age")?.name).toBe("age");
    expect(path).toBeUndefined();
    expect(headers).toBeUndefined();
  });

  it("should  have query and header parameters", async () => {
    const { program, createFoo } = await Tester.compile(t.code`
      @test model Foo {
         @query id: int32;
         @header age: int32;
         name: string;
      }

      @route("/foo")
      @post
      op ${t.op("createFoo")}(...Foo): void;
    `);
    const tk = $(program);
    const httpOperation = tk.httpOperation.get(createFoo);
    const headerAndQuery = tk.httpRequest.getParameters(httpOperation, ["header", "query"]);
    expect(headerAndQuery).toBeDefined();
    expect(headerAndQuery!.properties.size).toBe(2);
    expect(headerAndQuery!.properties.get("id")?.name).toBe("id");
    expect(headerAndQuery!.properties.get("age")?.name).toBe("age");
  });
});
