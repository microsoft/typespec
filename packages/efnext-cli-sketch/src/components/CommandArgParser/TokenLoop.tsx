/* eslint-disable unicorn/filename-case */
import { code, mapJoin, refkey } from "@alloy-js/core";
import { useCommand } from "./CommandArgParser.js";
import { OptionTokenHandler } from "./OptionTokenHandler.js";
import { PositionalTokenHandler } from "./PositionalTokenHandler.js";

export interface TokenLoopProps {}
// eslint-disable-next-line no-empty-pattern
export function TokenLoop({}: TokenLoopProps) {
  const { command } = useCommand();
  const options = command.options;
  const optionTokenHandlers = mapJoin(options, (option, path) => (
    <OptionTokenHandler option={option} path={path} />
  ));

  return code`
    for (const token of tokens) {
      if (token.kind === "positional") {
        ${(<PositionalTokenHandler />)}
      } else if (token.kind === "option") {
        switch (token.name) {
          case "h":
          case "help":
            ${refkey(command, "help")} />}();
            return;
          ${optionTokenHandlers}
        }
      }
    }
    (handler.${command.cli.name} as any)(... marshalledArgs);
  `;
}
