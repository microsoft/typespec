import {
  Experimental_ComponentOverrides,
  Experimental_ComponentOverridesConfig,
} from "#core/index.js";
import { Tester } from "#test/test-host.js";
import { FunctionDeclaration } from "#typescript/index.js";
import { For, List, type Children } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import type { Namespace } from "@typespec/compiler";
import { expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { InterfaceDeclaration } from "../../../src/typescript/components/interface-declaration.jsx";

it("uses overridden component", async () => {
  const { program } = await Tester.compile(`
          namespace DemoService;
          model Foo {
            knownProp: string;
          }

          op foo(): Foo;

          `);

  const [namespace] = program.resolveTypeReference("DemoService");
  const models = Array.from((namespace as Namespace).models.values());
  const operations = Array.from((namespace as Namespace).operations.values());

  expect(
    <Output program={program}>
      <TestClientOverrides>
        <SourceFile path="test.ts">
          <List hardline>
            {models.map((model) => (
              <InterfaceDeclaration export type={model} />
            ))}
          </List>
          <hbr />
          <For each={operations}>
            {(operation) => <FunctionDeclaration export type={operation} />}
          </For>
        </SourceFile>
      </TestClientOverrides>
    </Output>,
  ).toRenderTo(
    d`
      export interface Foo {
        knownProp: string;
      }
      export function foo(): unknown {}
            `,
  );
});

function TestClientOverrides(props: { children?: Children }) {
  const overrides = Experimental_ComponentOverridesConfig().forTypeKind("Model", {
    reference: (props) => {
      if (props.type.name === "Foo") {
        return "unknown";
      } else {
        return props.default;
      }
    },
  });
  return (
    <Experimental_ComponentOverrides overrides={overrides}>
      {props.children}
    </Experimental_ComponentOverrides>
  );
}
