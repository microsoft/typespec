import { expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("can check if a type is an Interface", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    interface Foo {};
    `,
    ["Foo"],
  );

  expect($(program).interface.is(Foo)).toBe(true);
});

it("returns false when the type is not an interface", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    model Foo {};
    `,
    ["Foo"],
  );

  expect($(program).interface.is(Foo)).toBe(false);
  expect($(program).interface.is($(program).value.create("foo"))).toBe(false);
});

it("creates a new Interface", async () => {
  const { program } = await createContextMock();
  const iface = $(program).interface.create({
    name: "Foo",
  });

  expect($(program).interface.is(iface)).toBe(true);
  expect(iface.name).toBe("Foo");
  expect(iface.operations.size).toBe(0);
});

it("creates an Interface with operations", async () => {
  const { program } = await createContextMock();

  const op = $(program).operation.create({
    name: "myOp",
    parameters: [],
    returnType: $(program).intrinsic.void,
  });

  const iface = $(program).interface.create({
    name: "Foo",
    operations: [op],
  });

  expect(iface.operations.size).toBe(1);
  expect(iface.operations.get("myOp")).toBe(op);
  expect(op.interface).toBe(iface);
});
