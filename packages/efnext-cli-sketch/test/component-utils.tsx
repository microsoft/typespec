import { Output, renderTree as render, RenderTextTree } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { format } from "prettier";
import { assert } from "vitest";

async function prepareExpected(expected: string) {
  const expectedRoot = (
    <Output>
      <SourceFile path="test.ts">
        {expected}
      </SourceFile>
    </Output>
  );

  const rendered = await render(expectedRoot);
  const raw = (rendered as any).flat(Infinity).join("");

  return format(raw, { parser: "typescript" });
}

async function prepareActual(actual: RenderTextTree) {
  const raw = (actual as any).flat(Infinity).join("");

  return format(raw, { parser: "typescript" });
}

export async function assertEqual(actual: RenderTextTree, expected: string) {
  const actualFormatted = await prepareActual(actual);
  const expectedFormatted = await prepareExpected(expected);

  assert.equal(actualFormatted, expectedFormatted);
}
