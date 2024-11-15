import { defineCodeFix } from "../diagnostics.js";

export function createShowLinterRuleDocUrlCodeFix(docUrl: string) {
  return defineCodeFix({
    id: "show-linter-rule-doc-url",
    label: `Open document`,
    url: docUrl,
    fix: (context) => {},
  });
}
