import { describe, expect, it } from "vitest";
import { emitOpenApiWithDiagnostics } from "./test-host.js";

interface TestCase {
  content: string;
  expected: string;
  description: string;
}

function createExpectedContentForStringLiteral(expected: string) {
  return `openapi: 3.0.0
info:
  title: (title)
  version: 0.0.0
tags: []
paths: {}
components:
  schemas:
    Test:
      type: object
      required:
        - test
      properties:
        test:
          type: string
          enum:
            - ${expected}
`;
}

function createExpectedContentForEnum(expected: string) {
  return `openapi: 3.0.0
info:
  title: (title)
  version: 0.0.0
tags: []
paths: {}
components:
  schemas:
    Test:
      type: string
      enum:
        - ${expected}
`;
}

function createTestCaseForStringLiteral(test: string, expected: string) {
  return {
    description: `string literal should output ${expected} in yaml file`,
    content: `model Test {test: "${test}"}`,
    expected: createExpectedContentForStringLiteral(`${expected}`),
  };
}

function createTestCaseForEnum(test: string, expected: string) {
  return {
    description: `enum should output ${expected} in yaml file`,
    content: `enum Test {test: "${test}"}`,
    expected: createExpectedContentForEnum(`${expected}`),
  };
}

const testCasesForStringLiteral: TestCase[] = [
  createTestCaseForStringLiteral(`y`, `'y'`),
  createTestCaseForStringLiteral(`Y`, `'Y'`),
  createTestCaseForStringLiteral(`yes`, `'yes'`),
  createTestCaseForStringLiteral(`Yes`, `'Yes'`),
  createTestCaseForStringLiteral(`YES`, `'YES'`),
  createTestCaseForStringLiteral(`yES`, `yES`),

  createTestCaseForStringLiteral(`n`, `'n'`),
  createTestCaseForStringLiteral(`N`, `'N'`),
  createTestCaseForStringLiteral(`no`, `'no'`),
  createTestCaseForStringLiteral(`No`, `'No'`),
  createTestCaseForStringLiteral(`NO`, `'NO'`),
  createTestCaseForStringLiteral(`nO`, `nO`),

  createTestCaseForStringLiteral(`true`, `'true'`),
  createTestCaseForStringLiteral(`True`, `'True'`),
  createTestCaseForStringLiteral(`TRUE`, `'TRUE'`),
  createTestCaseForStringLiteral(`tRUE`, `tRUE`),

  createTestCaseForStringLiteral(`false`, `'false'`),
  createTestCaseForStringLiteral(`False`, `'False'`),
  createTestCaseForStringLiteral(`FALSE`, `'FALSE'`),
  createTestCaseForStringLiteral(`fALSE`, `fALSE`),

  createTestCaseForStringLiteral(`on`, `'on'`),
  createTestCaseForStringLiteral(`On`, `'On'`),
  createTestCaseForStringLiteral(`ON`, `'ON'`),
  createTestCaseForStringLiteral(`oN`, `oN`),

  createTestCaseForStringLiteral(`off`, `'off'`),
  createTestCaseForStringLiteral(`Off`, `'Off'`),
  createTestCaseForStringLiteral(`OFF`, `'OFF'`),
  createTestCaseForStringLiteral(`oFF`, `oFF`),
];

const testCasesForEnum: TestCase[] = [
  createTestCaseForEnum(`y`, `'y'`),
  createTestCaseForEnum(`Y`, `'Y'`),
  createTestCaseForEnum(`yes`, `'yes'`),
  createTestCaseForEnum(`Yes`, `'Yes'`),
  createTestCaseForEnum(`YES`, `'YES'`),
  createTestCaseForEnum(`yES`, `yES`),

  createTestCaseForEnum(`n`, `'n'`),
  createTestCaseForEnum(`N`, `'N'`),
  createTestCaseForEnum(`no`, `'no'`),
  createTestCaseForEnum(`No`, `'No'`),
  createTestCaseForEnum(`NO`, `'NO'`),
  createTestCaseForEnum(`nO`, `nO`),

  createTestCaseForEnum(`true`, `'true'`),
  createTestCaseForEnum(`True`, `'True'`),
  createTestCaseForEnum(`TRUE`, `'TRUE'`),
  createTestCaseForEnum(`tRUE`, `tRUE`),

  createTestCaseForEnum(`false`, `'false'`),
  createTestCaseForEnum(`False`, `'False'`),
  createTestCaseForEnum(`FALSE`, `'FALSE'`),
  createTestCaseForEnum(`fALSE`, `fALSE`),

  createTestCaseForEnum(`on`, `'on'`),
  createTestCaseForEnum(`On`, `'On'`),
  createTestCaseForEnum(`ON`, `'ON'`),
  createTestCaseForEnum(`oN`, `oN`),

  createTestCaseForEnum(`off`, `'off'`),
  createTestCaseForEnum(`Off`, `'Off'`),
  createTestCaseForEnum(`OFF`, `'OFF'`),
  createTestCaseForEnum(`oFF`, `oFF`),
];


describe("Scalar formats of serialized document in YAML", () => {
  it.each([...testCasesForEnum, ...testCasesForStringLiteral])("$description", async (c: TestCase) => {
    const [_, __, content] = await emitOpenApiWithDiagnostics(c.content);
    expect(content).toBe(c.expected);
  });
});
