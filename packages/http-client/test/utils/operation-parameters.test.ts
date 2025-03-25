import { Operation } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { beforeAll, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createTypespecHttpClientLibraryTestRunner } from "../test-host.js";

let testOperations: Record<string, Operation> = {};

beforeAll(async () => {
  const runner = await createTypespecHttpClientLibraryTestRunner();

  testOperations = (await runner.compile(`
    @service(#{
      title: "Widget Service",
    })
    namespace DemoService;
    model QueryParams {
      @query
      filter?: string;
      
      @query
      orderBy?: string;
    }

    model NestedParams {
      basic?: BasicParams;
    }

    model BasicParams {
      @header
      name: string;
      @query
      age?: int32;
    }

    model ArrayParams {
      @query
      items: string[];
    }

    model DeeplyNestedParams {
      level1: {
        level2: {
          @query
          level3: string;
        };
      };
    }

    model OptionalNestedParams {
      
      optional?: {
        nested?: {
          @query
          value?: string;
        };
      };
    }


    interface TestOperations {
      @test
      @route("/simplequery")
      @get op simpleQuery(@bodyRoot input: QueryParams): string;
      @test
      @route("/nestedQuery")
      @get op nestedQuery(@bodyRoot input: NestedParams): string;
      @test
      @route("/arrayQuery")
      @get op arrayQuery(@bodyRoot input: ArrayParams): string;
      @test
      @route("/deepQuery")
      @get op deepQuery(@bodyRoot input: DeeplyNestedParams): string;
      @test
      @route("/optionalNestedQuery")
      @get op optionalNestedQuery(@bodyRoot input: OptionalNestedParams): string;
    }
    `)) as {
    simpleQuery: Operation;
    nestedQuery: Operation;
    arrayQuery: Operation;
    deepQuery: Operation;
    optionalNestedQuery: Operation;
  };
});

it("should resolve member access with a simple query parameter structure", async () => {
  const { simpleQuery } = testOperations;
  const httpOperation = $.httpOperation.get(simpleQuery);
  const queryParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpQueryParam(p.property),
  );

  expect(queryParams).toHaveLength(2);
  const filterParam = queryParams.find((p) => p.property.name === "filter");
  const orderByParam = queryParams.find((p) => p.property.name === "orderBy");
  expect(filterParam).toBeDefined();
  expect(orderByParam).toBeDefined();
  const filterAccess = $.httpOperation.formatParameterAccessExpression(httpOperation, filterParam!);
  const orderByAccess = $.httpOperation.formatParameterAccessExpression(
    httpOperation,
    orderByParam!,
  );
  expect(filterAccess).toEqual("input.filter");
  expect(orderByAccess).toEqual("input.orderBy");
});

it("should resolve member access with nested query parameters", async () => {
  const { nestedQuery } = testOperations;
  const httpOperation = $.httpOperation.get(nestedQuery);
  const queryParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpQueryParam(p.property),
  );

  const headerParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpHeader(p.property),
  );

  expect(queryParams).toHaveLength(1);
  const basicParam = queryParams.find((p) => p.property.name === "age");
  expect(basicParam).toBeDefined();
  const basicAccess = $.httpOperation.formatParameterAccessExpression(httpOperation, basicParam!);
  expect(basicAccess).toEqual("input.basic.age");

  expect(headerParams).toHaveLength(1);
  const headerParam = headerParams.find((p) => p.property.name === "name");
  expect(headerParam).toBeDefined();
  const headerAccess = $.httpOperation.formatParameterAccessExpression(httpOperation, headerParam!);
  expect(headerAccess).toEqual("input.basic.name");
});

it("should resolve member access with array query parameters", async () => {
  const { arrayQuery } = testOperations;
  const httpOperation = $.httpOperation.get(arrayQuery);
  const queryParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpQueryParam(p.property),
  );

  expect(queryParams).toHaveLength(1);
  const itemsParam = queryParams.find((p) => p.property.name === "items");
  expect(itemsParam).toBeDefined();
  const itemsAccess = $.httpOperation.formatParameterAccessExpression(httpOperation, itemsParam!);
  expect(itemsAccess).toEqual("input.items");
});

it("should resolve member access with deeply nested query parameters", async () => {
  const { deepQuery } = testOperations;
  const httpOperation = $.httpOperation.get(deepQuery);
  const queryParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpQueryParam(p.property),
  );

  expect(queryParams).toHaveLength(1);
  const level3Param = queryParams.find((p) => p.property.name === "level3");
  expect(level3Param).toBeDefined();
  const level3Access = $.httpOperation.formatParameterAccessExpression(httpOperation, level3Param!);
  expect(level3Access).toEqual("input.level1.level2.level3");
});

it("should resolve member access with optional nested query parameters", async () => {
  const { optionalNestedQuery } = testOperations;
  const httpOperation = $.httpOperation.get(optionalNestedQuery);
  const queryParams = httpOperation.parameters.properties.filter((p) =>
    $.modelProperty.isHttpQueryParam(p.property),
  );

  expect(queryParams).toHaveLength(1);
  const optionalParam = queryParams.find((p) => p.property.name === "value");
  expect(optionalParam).toBeDefined();
  const optionalAccess = $.httpOperation.formatParameterAccessExpression(
    httpOperation,
    optionalParam!,
  );
  expect(optionalAccess).toEqual("input.optional.nested.value");
});
