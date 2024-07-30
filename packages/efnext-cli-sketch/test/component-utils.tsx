import { EmitOutput, RenderedTreeNode, SourceFile, render } from "@typespec/efnext/framework";
import { format } from "prettier";
import { assert } from "vitest";

async function prepareExpected(expected: string) {
  const expectedRoot = (
    <EmitOutput>
      <SourceFile filetype="typescript" path="test.ts">
        {expected}
      </SourceFile>
    </EmitOutput>
  );

  const rendered = await render(expectedRoot);
  const raw = (rendered as any).flat(Infinity).join("");

  return format(raw, { parser: "typescript" });
}

async function prepareActual(actual: RenderedTreeNode) {
  const raw = (actual as any).flat(Infinity).join("");

  return format(raw, { parser: "typescript" });
}

export async function assertEqual(actual: RenderedTreeNode, expected: string) {
  const actualFormatted = await prepareActual(actual);
  const expectedFormatted = await prepareExpected(expected);

  assert.equal(actualFormatted, expectedFormatted);
}
