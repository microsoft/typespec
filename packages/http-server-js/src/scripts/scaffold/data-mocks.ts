import {
  isErrorType,
  isVoidType,
  LiteralType,
  Model,
  ModelProperty,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { JsContext, Module } from "../../ctx.js";
import { isUnspeakable, parseCase } from "../../util/case.js";

import { KEYWORDS } from "../../util/keywords.js";
import { getFullyQualifiedTypeName } from "../../util/name.js";

import { module as dateTimeHelper } from "../../../generated-defs/helpers/datetime.js";

/**
 * Generates a mock value for a TypeSpec Model.
 * Handles arrays and records as special cases.
 *
 * @param type - The TypeSpec Model to mock
 * @returns A JavaScript string representation of the mock data
 * @throws Error if a property cannot be mocked
 */
function mockModel(ctx: JsContext, module: Module, type: Model): string {
  const tk = $(ctx.program);
  if (tk.array.is(type)) {
    return mockArray(ctx, module, type);
  }

  if (tk.record.is(type)) {
    return mockRecord(ctx, module, type);
  }

  const mock: string[][] = [];
  const properties = tk.model.getProperties(type, { includeExtended: true });

  // If no properties exist, return an empty object
  if (properties.size === 0) {
    return "{}";
  }

  for (const [name, prop] of properties) {
    if (prop.optional || isUnspeakable(prop.name)) {
      continue;
    }

    const propMock = mockType(ctx, module, prop.type);

    if (!propMock) {
      throw new Error(`Could not mock property ${name} of type ${prop.type.kind}`);
    }

    const propName = parseCase(name).camelCase;
    mock.push([KEYWORDS.has(propName) ? `_${propName}` : propName, propMock]);
  }

  // If all properties were optional, return an empty object
  if (mock.length === 0) {
    return "{}";
  }

  return `{
    ${mock.map(([name, value]) => `${name}: ${value}`).join(",\n")}
  }`;
}

/**
 * Generates a mock array containing a single mocked element.
 *
 * @param type - The TypeSpec array Model to mock
 * @returns A JavaScript string representation of the mock array
 */
function mockArray(ctx: JsContext, module: Module, type: Model): string {
  const tk = $(ctx.program);
  const elementType = tk.array.getElementType(type);
  const mockedType = mockType(ctx, module, elementType);

  // If we can't mock the element type, return an empty array
  if (mockedType === undefined) {
    return "[]";
  }

  return `[${mockedType}]`;
}

/**
 * Generates a mock for a TypeSpec record type with a sample key.
 *
 * @param type - The TypeSpec record Model to mock
 * @returns A JavaScript string representation of the mock record
 */
function mockRecord(ctx: JsContext, module: Module, type: Model): string {
  const tk = $(ctx.program);
  const elementType = tk.record.getElementType(type);
  const mockedType = mockType(ctx, module, elementType);

  if (mockedType === undefined) {
    return "{}";
  }

  return `{
    mockKey: ${mockedType},
  }`;
}

/**
 * Mocks a TypeSpec Model property by mocking its type.
 *
 * @param prop - The TypeSpec model property to mock
 * @returns A JavaScript string representation of the mocked property or undefined if it cannot be mocked
 */
function mockModelProperty(
  ctx: JsContext,
  module: Module,
  prop: ModelProperty,
): string | undefined {
  return mockType(ctx, module, prop.type);
}

/**
 * Generates a mock for a TypeSpec literal value.
 *
 * @param type - The TypeSpec literal type to mock
 * @returns A JavaScript string representation of the literal value
 */
function mockLiteral(type: LiteralType): string {
  return JSON.stringify(type.value);
}

/**
 * Entry point for generating mock data for any TypeSpec type.
 * Delegates to specific mock functions based on the type kind.
 *
 * @param type - The TypeSpec type to mock
 * @returns A JavaScript string representation of the mock data, or undefined if the type cannot be mocked
 */
export function mockType(ctx: JsContext, module: Module, type: Type): string | undefined {
  const tk = $(ctx.program);
  if (tk.model.is(type)) {
    return mockModel(ctx, module, type);
  }

  if (tk.literal.is(type)) {
    return mockLiteral(type);
  }

  if (tk.modelProperty.is(type)) {
    return mockModelProperty(ctx, module, type);
  }

  if (tk.scalar.is(type)) {
    return mockScalar(ctx, module, type);
  }

  if (tk.union.is(type)) {
    return mockUnion(ctx, module, type);
  }

  if (isVoidType(type)) {
    return "void";
  }

  return undefined;
}

/**
 * Generates a mock for a TypeSpec union by mocking the first non-error variant.
 *
 * @param union - The TypeSpec union to mock
 * @returns A JavaScript string representation of a mock for one variant, or undefined if no suitable variant is found
 */
function mockUnion(ctx: JsContext, module: Module, union: Union): string | undefined {
  for (const variant of union.variants.values()) {
    if (isErrorType(variant.type)) {
      continue;
    }
    return mockType(ctx, module, variant.type);
  }

  return undefined;
}

/**
 * Generates appropriate mock values for TypeSpec scalar types.
 * Handles various scalar types including primitives and specialized types like dates.
 *
 * @param scalar - The TypeSpec scalar to mock
 * @returns A JavaScript string representation of a suitable mock value for the scalar type
 */
function mockScalar(ctx: JsContext, module: Module, scalar: Scalar): string | undefined {
  const tk = $(ctx.program);
  const dateTimeMode = ctx.options.datetime ?? "temporal-polyfill";

  if (tk.scalar.isBoolean(scalar) || tk.scalar.extendsBoolean(scalar)) {
    return JSON.stringify(true);
  }
  if (tk.scalar.isNumeric(scalar) || tk.scalar.extendsNumeric(scalar)) {
    if (
      tk.scalar.extendsSafeint(scalar) ||
      tk.scalar.extendsInt32(scalar) ||
      tk.scalar.extendsUint32(scalar) ||
      tk.scalar.extendsFloat64(scalar)
    ) {
      return "42";
    } else if (tk.scalar.extendsInteger(scalar)) {
      return "42n";
    } else {
      module.imports.push({ from: "decimal.js", binder: ["Decimal"] });
      return "new Decimal(42)";
    }
  }

  if (tk.scalar.isUtcDateTime(scalar)) {
    if (dateTimeMode === "date-duration") {
      return "new Date()";
    } else {
      if (dateTimeMode === "temporal-polyfill") {
        module.imports.push({
          from: "temporal-polyfill",
          binder: ["Temporal"],
        });
      }

      // Current instant
      return "Temporal.Now.instant()";
    }
  }

  if (
    tk.scalar.isOffsetDateTime(scalar) ||
    tk.scalar.isPlainDate(scalar) ||
    tk.scalar.isPlainTime(scalar)
  ) {
    if (dateTimeMode === "date-duration") {
      return "new Date()";
    } else {
      if (dateTimeMode === "temporal-polyfill") {
        module.imports.push({
          from: "temporal-polyfill",
          binder: ["Temporal"],
        });
      }

      // Current instant
      switch ((scalar as Scalar).name) {
        case "offsetDateTime":
          return "Temporal.Now.zonedDateTimeISO()";
        case "plainDate":
          return "Temporal.Now.zonedDateTimeISO().toPlainDate()";
        case "plainTime":
          return "Temporal.Now.zonedDateTimeISO().toPlainTime()";
        default:
          throw new Error("Unexpected scalar type: " + (scalar as Scalar).name);
      }
    }
  }

  if (getFullyQualifiedTypeName(scalar) === "TypeSpec.unixTimestamp32") {
    return "Math.floor(new Date().getTime() / 1000)";
  }

  if (tk.scalar.isBytes(scalar) || tk.scalar.extendsBytes(scalar)) {
    return "new Uint8Array()";
  }

  if (tk.scalar.isDuration(scalar) || tk.scalar.extendsDuration(scalar)) {
    if (dateTimeMode === "date-duration") {
      module.imports.push({
        from: dateTimeHelper,
        binder: ["Duration"],
      });

      return 'Duration.parseISO8601("P1Y2M3DT4H5M6S")';
    } else {
      if (dateTimeMode === "temporal-polyfill") {
        module.imports.push({
          from: "temporal-polyfill",
          binder: ["Temporal"],
        });
      }

      return `Temporal.Duration.from({ years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 })`;
    }
  }

  if (tk.scalar.isOffsetDateTime(scalar) || tk.scalar.extendsOffsetDateTime(scalar)) {
    return JSON.stringify("2022-01-01T00:00:00Z");
  }

  if (tk.scalar.isPlainDate(scalar) || tk.scalar.extendsPlainDate(scalar)) {
    return JSON.stringify("2022-01-01");
  }

  if (tk.scalar.isPlainTime(scalar) || tk.scalar.extendsPlainTime(scalar)) {
    return JSON.stringify("00:00:00");
  }

  if (tk.scalar.isUrl(scalar) || tk.scalar.extendsUrl(scalar)) {
    return JSON.stringify("https://example.com");
  }

  if (tk.scalar.isString(scalar) || tk.scalar.extendsString(scalar)) {
    return JSON.stringify("mock-string");
  }

  return undefined;
}
