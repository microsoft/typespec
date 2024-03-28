import { editor, languages } from "monaco-editor-core";
import { beforeAll, it } from "vitest";
import lang from "../src/typespec-monarch.js";

beforeAll(() => {
  languages.register({ id: "typespec" });
  languages.setMonarchTokensProvider("typespec", lang);
});

it("works", () => {
  const tokensByLine = editor.tokenize(`model foo {}`, "typespec");
  console.log("LKines", tokensByLine);
});
