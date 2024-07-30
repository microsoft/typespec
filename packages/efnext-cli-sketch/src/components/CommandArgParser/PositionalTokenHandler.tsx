/* eslint-disable unicorn/filename-case */
import { code } from "@alloy-js/core";
import { useCommand } from "./CommandArgParser.js";

export interface PositionalTokenHandlerProps {}

// eslint-disable-next-line no-empty-pattern
export function PositionalTokenHandler({}: PositionalTokenHandlerProps) {
  const { subcommandMap } = useCommand();
  // todo: positionals.
  if (subcommandMap && subcommandMap.size > 0) {
    const subcommandCases = [...subcommandMap.entries()].map(([name, cli]) => {
      return code`
        case "${name}": parse${name}Args(args.slice(token.index + 1)); return;
      `;
    });
    // TODO: Fix this any cast
    return code`
      switch (token.value) {
        ${subcommandCases as any} 
      }
    `;
  } else {
    return code`
        throw new Error("Unknown positional argument");
    `;
  }
}
