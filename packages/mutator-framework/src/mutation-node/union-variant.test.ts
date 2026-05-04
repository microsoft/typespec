import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of variant types", async () => {
  const { program, Foo, v1 } = await runner.compile(t.code`
      union ${t.union("Foo")} {
        ${t.unionVariant("v1")}: string;
        v2: int32;
      }
    `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const v1Node = engine.getMutationNode(v1);
  fooNode.connectVariant(v1Node);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  v1Node.connectType(stringNode);
  stringNode.mutate();
  expect(stringNode.isMutated).toBe(true);
  expect(v1Node.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expect(v1Node.mutatedType.type === stringNode.mutatedType).toBeTruthy();
});

it("is deleted when its container union is deleted", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      union ${t.union("Foo")} {
        ${t.unionVariant("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectVariant(propNode);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  propNode.connectType(stringNode);

  fooNode.delete();
  expect(propNode.isDeleted).toBe(true);
});

it("is deleted when its container union is replaced", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      union ${t.union("Foo")} {
        ${t.unionVariant("prop")}: string;
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectVariant(propNode);
  const stringNode = engine.getMutationNode($(program).builtin.string);
  propNode.connectType(stringNode);

  fooNode.replace($(program).builtin.string);
  expect(propNode.isDeleted).toBe(true);
});
