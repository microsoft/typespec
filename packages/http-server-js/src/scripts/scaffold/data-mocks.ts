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

function mockModel(type: Model): string {
  if ($.array.is(type)) {
    return mockArray(type);
  }

  if ($.record.is(type)) {
    return mockRecord(type);
  }

  const mock: string[][] = [];
  const properties = $.model.getProperties(type, { includeExtended: true });
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

  return `{
    ${mock.map(([name, value]) => `${name}: ${value}`).join(",\n")}
  }`;
}

function mockArray(type: Model): string {
  const elementType = $.array.getElementType(type);
  const mockedType = mockType(elementType) ?? "";
  return `[${mockedType}]`;
}

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

function mockModelProperty(prop: ModelProperty): any {
  return mockType(prop.type);
}

function mockLiteral(type: LiteralType): any {
  return JSON.stringify(type.value);
}

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

function mockUnion(union: Union): string | undefined {
  for (const variant of union.variants.values()) {
    if (isErrorType(variant.type)) {
      continue;
    }
    return mockType(variant.type);
  }

  return undefined;
}

function mockScalar(scalar: Scalar) {
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
