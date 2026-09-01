import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { TypeGraph } from "./type-graph.js";
import { computeTree, filterProjectCode, type TypeGraphNode } from "./use-tree-navigation.js";

async function computeTreesFor(code: string) {
  const { program } = await Tester.compile(code);
  const full = computeTree(program);
  return { full, filtered: filterProjectCode(program, full) };
}

function names(node: TypeGraphNode): string[] {
  return node.children.map((x) => x.name.toString());
}

function find(node: TypeGraphNode, name: string): TypeGraphNode | undefined {
  return node.children.find((x) => x.name.toString() === name);
}

it("keeps the namespaces declared in the user project", async () => {
  const { filtered } = await computeTreesFor(`namespace MyService; model Foo {}`);

  expect(names(filtered)).toContain("MyService");
});

it("removes the namespaces coming from the compiler or a library", async () => {
  const { full, filtered } = await computeTreesFor(`namespace MyService; model Foo {}`);

  expect(names(full)).toContain("TypeSpec");
  expect(names(filtered)).not.toContain("TypeSpec");
});

it("only keeps the members declared in the user project", async () => {
  const { filtered } = await computeTreesFor(`
    namespace MyService;
    model Foo {}
  `);

  const ns = find(filtered, "MyService")!;
  expect(ns).toBeDefined();
  const models = find(ns, "models")!;
  expect(names(models)).toEqual(["Foo"]);
});

it("keeps a library namespace that the user project is augmenting", async () => {
  const { filtered } = await computeTreesFor(`
    namespace TypeSpec;
    model MyExtension {}
  `);

  const ns = find(filtered, "TypeSpec");
  expect(ns).toBeDefined();
  expect(names(find(ns!, "models")!)).toEqual(["MyExtension"]);
});

it("keeps the types declared in the global namespace", async () => {
  const { filtered } = await computeTreesFor(`model Foo {}`);

  const global = find(filtered, "(global)")!;
  expect(global).toBeDefined();
  expect(names(find(global, "models")!)).toEqual(["Foo"]);
});

it("hides the library types in the navigation tree by default", async () => {
  const { program } = await Tester.compile(`namespace MyService; model Foo {}`);
  render(<TypeGraph program={program} />);

  const tree = within(screen.getByRole("tree"));
  expect(tree.getByTitle("MyService")).toBeDefined();
  expect(tree.queryByTitle("TypeSpec")).toBeNull();
});

it("shows the library types when defaultOnlyProjectCode is false", async () => {
  const { program } = await Tester.compile(`namespace MyService; model Foo {}`);
  render(<TypeGraph program={program} defaultOnlyProjectCode={false} />);

  const tree = within(screen.getByRole("tree"));
  expect(tree.getByTitle("MyService")).toBeDefined();
  expect(tree.getByTitle("TypeSpec")).toBeDefined();
});

it("toggling the library types button on reveals the library types", async () => {
  const { program } = await Tester.compile(`namespace MyService; model Foo {}`);
  render(<TypeGraph program={program} />);

  expect(within(screen.getByRole("tree")).queryByTitle("TypeSpec")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /show the types coming from/i }));

  expect(within(screen.getByRole("tree")).getByTitle("TypeSpec")).toBeDefined();
});

it("still shows a type hidden from the tree, explaining it is not listed", async () => {
  const { program } = await Tester.compile(`namespace MyService; model Foo {}`);
  render(<TypeGraph program={program} currentPath="$.TypeSpec.models.Array" />);

  // The type itself is shown ...
  expect(screen.getByText("Standard library")).toBeDefined();
  // ... with a notice that the tree does not list it.
  expect(screen.getByText(/not listed in the tree/)).toBeDefined();
  expect(within(screen.getByRole("tree")).queryByTitle("TypeSpec")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /show library types/i }));

  expect(screen.queryByText(/not listed in the tree/)).toBeNull();
  expect(within(screen.getByRole("tree")).getByTitle("TypeSpec")).toBeDefined();
});

it("offers to show everything when the project declares no type", async () => {
  const { program } = await Tester.compile(``);
  render(<TypeGraph program={program} />);

  expect(screen.getByText("No types declared in your code.")).toBeDefined();
});
