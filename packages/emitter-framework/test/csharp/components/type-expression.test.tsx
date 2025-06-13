import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

it("renders a scalar type expression", async () => {});
it("renders an intrinsic type expression");
it("renders a model type expression");
it("renders a union type expression");
it("renders a enum type expression");
it("renders a tuple type expression");
it("renders a union variant type expression");
it("renders a model property type expression");
