import { Output, render, SourceFile } from "@alloy-js/core";
import { it } from "vitest";

it("works", () => {
  const tree = render(
    <Output>
      <SourceFile path="readme.md" filetype="markdown">
        ## This is a test!
      </SourceFile>
    </Output>
  );

  console.log(tree);
});
