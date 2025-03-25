import { Model, ModelProperty } from "@typespec/compiler";
import { HttpProperty } from "@typespec/http";
import { AccessPathSegment } from "@typespec/http-client";
import { expect, it } from "vitest";
import { TypeScriptPropertyAccessPolicy } from "../../../src/utils/ts-property-access-policy.js";

it("should return empty string for empty metadata", () => {
  const httpProperty: HttpProperty = {} as HttpProperty;
  const result = TypeScriptPropertyAccessPolicy.fromatPropertyAccessExpression(httpProperty, []);
  expect(result).toBe("");
});

it("should format a simple property access", () => {
  const httpProperty: HttpProperty = {
    kind: "body",
    path: ["testProperty"],
    property: {
      name: "testProperty",
      optional: false,
      kind: "ModelProperty",
      type: {},
    },
  } as HttpProperty;
  const segments: AccessPathSegment[] = [
    { property: httpProperty.property, segmentName: "testProperty" },
  ];

  const result = TypeScriptPropertyAccessPolicy.fromatPropertyAccessExpression(
    segments,
  );
  expect(result).toBe("testProperty");
});

it("should format a nested property access", () => {
  const filterProperty: ModelProperty = {
    name: "filter",
    optional: false,
    kind: "ModelProperty",
    type: {
      kind: "String",
      value: "Foo",
    },
  } as ModelProperty;

  const fooProperty: ModelProperty = {
    name: "foo",
    optional: false,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["filter", filterProperty]]),
    },
  } as ModelProperty;

  const inputProperty: ModelProperty = {
    name: "input",
    optional: false,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["foo", fooProperty]]),
    } as Model,
  } as ModelProperty;

  const httpProperty: HttpProperty = {
    kind: "query",
    path: ["input", "foo", "filter"],
    property: filterProperty,
  } as HttpProperty;

  const segments: AccessPathSegment[] = [
    { property: inputProperty, segmentName: "input", parent: undefined },
    { property: fooProperty, segmentName: "foo", parent: inputProperty },
    { property: filterProperty, segmentName: "filter", parent: fooProperty },
  ];

  const result = TypeScriptPropertyAccessPolicy.fromatPropertyAccessExpression(
    segments,
  );
  expect(result).toBe("input.foo.filter");
});

it("should format a nested property access with an optional parent", () => {
  const filterProperty: ModelProperty = {
    name: "filter",
    optional: false,
    kind: "ModelProperty",
    type: {
      kind: "String",
      value: "Foo",
    },
  } as ModelProperty;

  const fooProperty: ModelProperty = {
    name: "foo",
    optional: true,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["filter", filterProperty]]),
    },
  } as ModelProperty;

  const inputProperty: ModelProperty = {
    name: "input",
    optional: false,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["foo", fooProperty]]),
    } as Model,
  } as ModelProperty;

  const httpProperty: HttpProperty = {
    kind: "query",
    path: ["input", "foo", "filter"],
    property: filterProperty,
  } as HttpProperty;

  const segments: AccessPathSegment[] = [
    { property: inputProperty, segmentName: "input", parent: undefined },
    { property: fooProperty, segmentName: "foo", parent: inputProperty },
    { property: filterProperty, segmentName: "filter", parent: fooProperty },
  ];

  const result = TypeScriptPropertyAccessPolicy.fromatPropertyAccessExpression(
    segments,
  );
  expect(result).toBe("input.foo?.filter");
});

it("should format a nested property access with an optional top level parameter", () => {
  const filterProperty: ModelProperty = {
    name: "filter",
    optional: true,
    kind: "ModelProperty",
    type: {
      kind: "String",
      value: "Foo",
    },
  } as ModelProperty;

  const fooProperty: ModelProperty = {
    name: "foo",
    optional: true,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["filter", filterProperty]]),
    },
  } as ModelProperty;

  const inputProperty: ModelProperty = {
    name: "input",
    optional: true,
    kind: "ModelProperty",
    type: {
      kind: "Model",
      properties: new Map([["foo", fooProperty]]),
    } as Model,
  } as ModelProperty;

  const httpProperty: HttpProperty = {
    kind: "query",
    path: ["input", "foo", "filter"],
    property: filterProperty,
  } as HttpProperty;

  const segments: AccessPathSegment[] = [
    { property: inputProperty, segmentName: "input", parent: undefined },
    { property: fooProperty, segmentName: "foo", parent: inputProperty },
    { property: filterProperty, segmentName: "filter", parent: fooProperty },
  ];

  const result = TypeScriptPropertyAccessPolicy.fromatPropertyAccessExpression(
    segments,
  );
  expect(result).toBe("options?.input?.foo?.filter");
});
