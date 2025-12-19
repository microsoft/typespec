import { expectTypeEquals, t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { getEngine } from "../../test/utils.js";
let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

it("handles mutation of member values", async () => {
  const { program, Foo, a } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("a")}: "valueA";
        b: "valueB";
      }
    `);

  const engine = getEngine(program);
  const fooNode = engine.getMutationNode(Foo);
  const aNode = engine.getMutationNode(a);
  fooNode.connectMember(aNode);
  aNode.mutate((clone) => (clone.value = "valueARenamed"));
  expect(aNode.isMutated).toBe(true);
  expect(fooNode.isMutated).toBe(true);
  expectTypeEquals(fooNode.mutatedType.members.get("a")!, aNode.mutatedType);
  expect(aNode.mutatedType.value).toBe("valueARenamed");
});

it("is deleted when its container enum is deleted", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("prop")};
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectMember(propNode);

  fooNode.delete();
  expect(propNode.isDeleted).toBe(true);
});

it("is deleted when its container enum is replaced", async () => {
  const { Foo, prop, program } = await runner.compile(t.code`
      enum ${t.enum("Foo")} {
        ${t.enumMember("prop")};
      }
    `);
  const engine = getEngine(program);
  const propNode = engine.getMutationNode(prop);
  const fooNode = engine.getMutationNode(Foo);
  fooNode.connectMember(propNode);

  fooNode.replace($(program).builtin.string);
  expect(propNode.isDeleted).toBe(true);
});
