/* eslint-disable unicorn/filename-case */
import { code } from "@alloy-js/core";
import { ObjectExpression } from "@alloy-js/typescript";
import { useHelpers } from "../../helpers.js";
import { useCommand } from "./CommandArgParser.js";

export interface GetTokensProps {}

// eslint-disable-next-line no-empty-pattern
export function GetTokens({}: GetTokensProps) {
  const { options } = useCommand();
  const helpers = useHelpers();

  const parseArgsArg: Record<string, any> = {
    args: "ARGS",
    tokens: true,
    strict: false,
    options: {},
  };

  // assemble the options in parseArgsArg and arg handlers.
  for (const [option, path] of options) {
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
    const {"{"} tokens {"}"} = nodeParseArgs(
      <ObjectExpression jsValue={parseArgsArg} />
    );
  </>
}
