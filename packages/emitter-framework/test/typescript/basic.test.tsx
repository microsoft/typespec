import { Output, render } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";

import { it } from "vitest";
import { FunctionDeclaration } from "../../src/typescript/components/function-declaration.js";

it("works", () => {
  const tree = render(
    <Output>
      <SourceFile path="index.ts">
        <FunctionDeclaration name="test">alert("Hello!");</FunctionDeclaration>
      </SourceFile>
    </Output>
  );

  console.log(tree);
});
