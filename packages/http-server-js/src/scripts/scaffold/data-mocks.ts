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
import { $ } from "@typespec/compiler/experimental/typekit";
import { parseCase } from "../../util/case.js";

/**
 * Generates a mock value for a TypeSpec Model.
 * Handles arrays and records as special cases.
 *
 * @param type - The TypeSpec Model to mock
 * @returns A JavaScript string representation of the mock data
 * @throws Error if a property cannot be mocked
 */
function mockModel(type: Model): string {
  if ($.array.is(type)) {
    return mockArray(type);
  }

  if ($.record.is(type)) {
    return mockRecord(type);
  }

  const mock: string[][] = [];
  const properties = $.model.getProperties(type, { includeExtended: true });

  // If no properties exist, return an empty object
  if (properties.size === 0) {
    return "{}";
  }

  for (const [name, prop] of properties) {
    if (prop.optional) {
      continue;
    }

    const propMock = mockType(prop.type);

    if (!propMock) {
      throw new Error(`Could not mock property ${name} of type ${prop.type.kind}`);
    }

    const propName = parseCase(name).camelCase;
    mock.push([propName, propMock]);
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
function mockArray(type: Model): string {
  const elementType = $.array.getElementType(type);
  const mockedType = mockType(elementType);

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
function mockRecord(type: Model): string {
  const elementType = $.record.getElementType(type);
  const mockedType = mockType(elementType);

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
function mockModelProperty(prop: ModelProperty): string | undefined {
  return mockType(prop.type);
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
export function mockType(type: Type): string | undefined {
  if ($.model.is(type)) {
    return mockModel(type);
  }

  if ($.literal.is(type)) {
    return mockLiteral(type);
  }

  if ($.modelProperty.is(type)) {
    return mockModelProperty(type);
  }

  if ($.scalar.is(type)) {
    return mockScalar(type);
  }

  if ($.union.is(type)) {
    return mockUnion(type);
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
function mockUnion(union: Union): string | undefined {
  for (const variant of union.variants.values()) {
    if (isErrorType(variant.type)) {
      continue;
    }
    return mockType(variant.type);
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
function mockScalar(scalar: Scalar): string | undefined {
  if ($.scalar.isBoolean(scalar) || $.scalar.extendsBoolean(scalar)) {
    return JSON.stringify(true);
  }
  if ($.scalar.isNumeric(scalar) || $.scalar.extendsNumeric(scalar)) {
    return JSON.stringify(42);
  }

  if ($.scalar.isUtcDateTime(scalar) || $.scalar.extendsUtcDateTime(scalar)) {
    return "new Date()";
  }

  if ($.scalar.isBytes(scalar) || $.scalar.extendsBytes(scalar)) {
    return "new Uint8Array()";
  }

  if ($.scalar.isDuration(scalar) || $.scalar.extendsDuration(scalar)) {
    return JSON.stringify("P1Y2M3DT4H5M6S");
  }

  if ($.scalar.isOffsetDateTime(scalar) || $.scalar.extendsOffsetDateTime(scalar)) {
    return JSON.stringify("2022-01-01T00:00:00Z");
  }

  if ($.scalar.isPlainDate(scalar) || $.scalar.extendsPlainDate(scalar)) {
    return JSON.stringify("2022-01-01");
  }

  if ($.scalar.isPlainTime(scalar) || $.scalar.extendsPlainTime(scalar)) {
    return JSON.stringify("00:00:00");
  }

  if ($.scalar.isUrl(scalar) || $.scalar.extendsUrl(scalar)) {
    return JSON.stringify("https://example.com");
  }

  if ($.scalar.isString(scalar) || $.scalar.extendsString(scalar)) {
    return JSON.stringify("mock-string");
  }

  return undefined;
}
