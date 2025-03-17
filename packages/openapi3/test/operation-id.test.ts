import { expect, it } from "vitest";
import { OpenAPI3Document } from "../src/types.js";
import { worksFor } from "./works-for.js";

interface Case {
  description: string;
  code: string;
  expectedOperationId: string;
}

const testCases: Case[] = [
  {
    description: "should reuse on the same operation IDs",
    code: createCode("op1", "op1", "op1"),
    expectedOperationId: "op1",
  },
  {
    description: "should concat with different operation IDs",
    code: createCode("op1", "op1", "op2"),
    expectedOperationId: "op1_op1_op2",
  },
  {
    description: "should concat with partial operation IDs",
    code: createCode(undefined, "op1", "op1"),
    expectedOperationId: "getWidget1_op1_op1",
  },
  {
    description: "should concat with no operation IDs",
    code: createCode(),
    expectedOperationId: "getWidget1_getWidget2_getWidget3",
  },
];

worksFor(["3.0.0", "3.1.0"], ({ openApiFor }) => {
  it.each(testCases)("$description", async (c: Case) => {
    const res: OpenAPI3Document = await openApiFor(c.code);
    expect(res.paths["/{id}"].get?.operationId).toBe(c.expectedOperationId);
  });
});

function createCode(id1?: string, id2?: string, id3?: string) {
  return `
        @service
        namespace DemoService;
        ${createOperationCodeBlock(1, id1)}
        ${createOperationCodeBlock(2, id2)}
        ${createOperationCodeBlock(3, id3)}
        `;
}

function createOperationCodeBlock(operationIndex: number, id?: string) {
  return `
        @sharedRoute
        ${createOperationIdDecorator(id)}
        op getWidget${operationIndex}(@path id: string): void;
        `;
}

function createOperationIdDecorator(id?: string) {
  return id ? `@operationId("${id}")` : "";
}
