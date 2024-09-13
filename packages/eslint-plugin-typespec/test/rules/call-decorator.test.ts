import { RuleTester } from "@typescript-eslint/rule-tester";
import { callDecoratorRule } from "../../src/rules/call-decorator";
import { getFixturesRootDir } from "./utils";

const rootDir = getFixturesRootDir();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      project: "./tsconfig.json",
      tsconfigRootDir: rootDir,
    },
  },
});

ruleTester.run("call-decorator", callDecoratorRule, {
  valid: [
    {
      name: "Valid if using .call to call decorator",
      code: `
interface DecoratorContext {}; interface Type {};

function $foo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  context.call($bar, target);
}
    `,
    },
    {
      name: "Valid if passing context to a non decorator function",
      code: `
interface DecoratorContext {}; interface Type {};

function setFoo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  setFoo(context, target);
}
    `,
    },
  ],
  invalid: [
    {
      code: `
interface DecoratorContext {}; interface Type {};

function $foo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  $foo(context, target);
}
    `,
      errors: [
        {
          line: 7,
          messageId: "default",
          suggestions: [
            {
              messageId: "suggestReplaceWithContextCall",
              output: `
interface DecoratorContext {}; interface Type {};

function $foo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  context.call($foo, target);
}
    `,
            },
          ],
        },
      ],
    },
  ],
});
