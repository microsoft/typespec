import { getProgram } from "#test/utils.js";
import type { Children } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Enum, Interface, Model, Operation, Type, Union } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import {
  EnumDeclaration,
  EnumMember,
} from "../../../src/typescript/components/enum-declaration.js";
import { TypeAliasDeclaration } from "../../../src/typescript/components/type-alias-declaration.js";
import {
  ClassMethod,
  FunctionDeclaration,
  InterfaceDeclaration,
  TypeDeclaration,
  UnionDeclaration,
} from "../../../src/typescript/index.js";
import { TestFile } from "../utils.jsx";

describe("TypeScript deprecation documentation", () => {
  it.each<{
    kind: string;
    code: string;
    render: (type: Type) => Children;
    expected: string;
  }>([
    {
      kind: "type alias",
      code: "scalar Example extends string;",
      render: (type) => <TypeAliasDeclaration type={type} doc={undefined} />,
      expected: "type Example = string;",
    },
    {
      kind: "union",
      code: 'union Example { "one", "two" }',
      render: (type) => <UnionDeclaration type={type as Union} doc={undefined} />,
      expected: 'type Example = "one" | "two";',
    },
    {
      kind: "dispatched declaration",
      code: "scalar Example extends string;",
      render: (type) => <TypeDeclaration type={type} />,
      expected: "type Example = string;",
    },
  ])(
    "preserves documentation and deprecation on $kind declarations",
    async ({ code, render, expected }) => {
      const program = await getProgram(`
      /** An old type. */
      #deprecated "Use Replacement instead."
      ${code}
    `);
      const [type] = program.resolveTypeReference("Example");

      expect(<TestFile program={program}>{render(type!)}</TestFile>).toRenderTo(`
      /**
       * An old type.
       *
       * @deprecated Use Replacement instead.
       */
      ${expected}
    `);
    },
  );

  it("preserves model and property deprecation, including an empty message", async () => {
    const program = await getProgram(`
      /** An old widget. */
      #deprecated "Use NewWidget instead."
      model Widget {
        /** The old title. */
        #deprecated "Use name instead."
        title?: string;
        #deprecated ""
        legacy: string;
        name: string;
      }
    `);
    const [model] = program.resolveTypeReference("Widget");

    expect(
      <TestFile program={program}>
        <InterfaceDeclaration type={model as Model} />
      </TestFile>,
    ).toRenderTo(`
      /**
       * An old widget.
       *
       * @deprecated Use NewWidget instead.
       */
      interface Widget {
        /**
         * The old title.
         *
         * @deprecated Use name instead.
         */
        title?: string;
        /**
         * @deprecated
         */
        legacy: string;
        name: string;
      }
    `);
  });

  it("preserves deprecation and parameter docs on generated interface methods", async () => {
    const program = await getProgram(`
      #deprecated "Use NewApi instead."
      interface Api {
        /**
         * Gets the old title.
         * @param id The widget id.
         */
        #deprecated "Use getName instead."
        getTitle(id: string): string;
      }
    `);
    const [type] = program.resolveTypeReference("Api");

    expect(
      <TestFile program={program}>
        <InterfaceDeclaration type={type as Interface} />
      </TestFile>,
    ).toRenderTo(`
      /**
       * @deprecated Use NewApi instead.
       */
      interface Api {
        /**
         * Gets the old title.
         *
         * @deprecated Use getName instead.
         *
         * @param {string} id - The widget id.
         */
        getTitle(id: string): string;
      }
    `);
  });

  it.each<{
    kind: string;
    render: (type: Operation) => Children;
    expected: string;
  }>([
    {
      kind: "function",
      render: (type) => <FunctionDeclaration type={type} />,
      expected: `
        /**
         * Gets the old title.
         *
         * @deprecated Use getName instead.
         *
         * @param {string} id - The widget id.
         */
        function getTitle(id: string): string {}
      `,
    },
    {
      kind: "class method",
      render: (type) => (
        <ts.ClassDeclaration name="Api">
          <ClassMethod type={type} />
        </ts.ClassDeclaration>
      ),
      expected: `
        class Api {
          /**
           * Gets the old title.
           *
           * @deprecated Use getName instead.
           *
           * @param {string} id - The widget id.
           */
          getTitle(id: string): string {}
        }
      `,
    },
  ])(
    "preserves deprecation and parameter docs on $kind declarations",
    async ({ render, expected }) => {
      const program = await getProgram(`
      /**
       * Gets the old title.
       * @param id The widget id.
       */
      #deprecated "Use getName instead."
      op getTitle(id: string): string;
    `);
      const [operation] = program.resolveTypeReference("getTitle");
      expect(<TestFile program={program}>{render(operation as Operation)}</TestFile>).toRenderTo(
        expected,
      );
    },
  );

  it.each(["enum", "union"])(
    "preserves deprecation when emitting %s types as enums",
    async (kind) => {
      const program = await getProgram(`
      /** The old colors. */
      #deprecated "Use NewColor instead."
      ${kind} Color {
        /** The old color. */
        #deprecated "Use blue instead."
        red: "red",
        blue: "blue",
      }
    `);
      const [type] = program.resolveTypeReference("Color");

      expect(
        <TestFile program={program}>
          <EnumDeclaration type={type as Enum | Union} />
        </TestFile>,
      ).toRenderTo(`
      /**
       * The old colors.
       *
       * @deprecated Use NewColor instead.
       */
      enum Color {
        /**
         * The old color.
         *
         * @deprecated Use blue instead.
         */
        red = "red",
        blue = "blue"
      }
    `);
    },
  );

  it("preserves source documentation on a standalone enum member", async () => {
    const program = await getProgram(`
      enum Color {
        /** The old color. */
        #deprecated "Use blue instead."
        red: "red",
      }
    `);
    const [type] = program.resolveTypeReference("Color");

    expect(
      <TestFile program={program}>
        <ts.EnumDeclaration name="Color">
          <EnumMember type={(type as Enum).members.get("red")!} />
        </ts.EnumDeclaration>
      </TestFile>,
    ).toRenderTo(`
      enum Color {
        /**
         * The old color.
         *
         * @deprecated Use blue instead.
         */
        red = "red"
      }
    `);
  });

  it("keeps explicit documentation authoritative", async () => {
    const program = await getProgram(`
      /** An old type. */
      #deprecated "Use Replacement instead."
      scalar Example extends string;
    `);
    const [type] = program.resolveTypeReference("Example");

    expect(
      <TestFile program={program}>
        <TypeDeclaration type={type!} doc={["Custom documentation."]} />
      </TestFile>,
    ).toRenderTo(`
      /**
       * Custom documentation.
       */
      type Example = string;
    `);
  });
});
