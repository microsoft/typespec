import { expect, it } from "vitest";
import { EmitContext, Type } from "../../src/core/types.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { string } from "../../src/typekit/kits/string.js";
import { createContextMock } from "./utils.js";

it("can check for a string", async () => {
  const { context, foo, bar } = await getTypes(
    `
    alias foo = string;
    alias bar = boolean;
    `,
    ["foo", "bar"]
  );
  const helper = string({ context });
  expect(helper.is(foo!)).toBe(true);
  expect(helper.is(bar!)).toBe(false);
});

export async function getTypes<const T extends string>(
  code: string,
  names: T[]
): Promise<{ [k in T]: Type } & { context: EmitContext }> {
  const host = await createTestHost();
  const runner = createTestWrapper(host);
  await runner.compile(`
    alias foo = string;
    alias bar = boolean;
  `);

  const obj: any = {
    context: await createContextMock(runner.program),
  };

  for (const name of names) {
    obj[name] = runner.program.resolveTypeReference(name)[0]!;
  }
  return obj;
}
