/* eslint-disable unicorn/filename-case */
import { node, ObjectExpression, Reference } from "@alloy-js/typescript";
import { useHelpers } from "../../helpers.js";
import { useCommand } from "./CommandArgParser.js";

export interface GetTokensProps {}

// eslint-disable-next-line no-empty-pattern
export function GetTokens({}: GetTokensProps) {
  const { command: { options } } = useCommand();
  const helpers = useHelpers();

  const parseArgsArg: Record<string, any> = {
    args: () => "args",
    tokens: true,
    strict: false,
    options: {},
  };

  // assemble the options in parseArgsArg and arg handlers.
  for (const [option] of options) {
    const argOptions: Record<string, any> = {};
    parseArgsArg.options[option.name] = argOptions;

    if (helpers.boolean.is(option.type)) {
      argOptions.type = "boolean";
    } else {
      argOptions.type = "string";
    }

    if (helpers.option.hasShortName(option)) {
      argOptions.short = helpers.option.getShortName(option);
    }
  }

  return <>
    const {"{"} tokens {"}"} = {node.util.parseArgs}(<ObjectExpression jsValue={parseArgsArg} />);
  </>
}
