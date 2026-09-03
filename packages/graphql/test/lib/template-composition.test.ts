import { resolvePath, type Model } from "@typespec/compiler";
import { createTester, t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { composeTemplateName } from "../../src/lib/template-composition.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: [],
});

function getReturnType(ns: Record<string, any>, opName: string): Model {
  return ns.operations.get(opName)!.returnType as Model;
}

describe("composeTemplateName", () => {
  it("composes single arg: PaginatedModel<AdAccount> → PaginatedModelOfAdAccount", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model AdAccount { id: string; }
        model PaginatedModel<T> { items: T[]; }
        op get(): PaginatedModel<AdAccount>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("PaginatedModelOfAdAccount");
  });

  it("composes multiple args joined with And: MyMap<string, int32> → MyMapOfStringAndInt32", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model MyMap<K, V> { key: K; value: V; }
        op get(): MyMap<string, int32>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("MyMapOfStringAndInt32");
  });

  it("handles array arg: GetResponse<Fruit[]> → GetResponseOfFruitArray", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Fruit { name: string; }
        model GetResponse<T> { data: T; }
        op get(): GetResponse<Fruit[]>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("GetResponseOfFruitArray");
  });

  it("handles nested template: Wrapper<PaginatedModel<Board>> → WrapperOfPaginatedModelOfBoard", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model Board { id: string; }
        model PaginatedModel<T> { items: T[]; }
        model Wrapper<T> { data: T; }
        op get(): Wrapper<PaginatedModel<Board>>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("WrapperOfPaginatedModelOfBoard");
  });

  it("handles deeply nested: A<B<C<D>>> → AOfBOfCOfD", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model D { id: string; }
        model C<T> { c: T; }
        model B<T> { b: T; }
        model A<T> { a: T; }
        op get(): A<B<C<D>>>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("AOfBOfCOfD");
  });

  it("strips namespace from args: Response<Pinterest.API.User> → ResponseOfUser", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace Pinterest.API {
        model User { id: string; }
      }
      namespace ${t.namespace("TestNs")} {
        model Response<T> { data: T; }
        op get(): Response<Pinterest.API.User>;
      }
    `);

    const instance = getReturnType(TestNs, "get");
    expect(composeTemplateName(instance)).toBe("ResponseOfUser");
  });

  it("returns raw name for non-template types", async () => {
    const { TestNs } = await Tester.compile(t.code`
      namespace ${t.namespace("TestNs")} {
        model PlainModel { id: string; }
      }
    `);

    const model = TestNs.models.get("PlainModel")!;
    expect(composeTemplateName(model)).toBe("PlainModel");
  });
});
