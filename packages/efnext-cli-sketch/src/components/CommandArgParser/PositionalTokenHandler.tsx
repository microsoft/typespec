/* eslint-disable unicorn/filename-case */
import { code, mapJoin, refkey } from "@alloy-js/core";
import { useCommand } from "./CommandArgParser.js";

export interface PositionalTokenHandlerProps {}

// eslint-disable-next-line no-empty-pattern
export function PositionalTokenHandler({}: PositionalTokenHandlerProps) {
  const { subcommandMap } = useCommand();
  // todo: positionals.
  
  if (subcommandMap && subcommandMap.size > 0) {
    const subcommandCases = mapJoin(subcommandMap, (name, subcommand) => {
      return code`
        case "${name}":
          ${refkey(subcommand, "parseArgs")}(args.slice(token.index + 1));
          return;
      `;
    });

    return code`
      switch (token.value) {
        ${subcommandCases} 
      }
    `;
  } else {
    return code`
        throw new Error("Unknown positional argument");
    `;
  }
}
