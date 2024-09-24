/* eslint-disable unicorn/filename-case */
import { createContext, refkey, useContext } from "@alloy-js/core";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { Command } from "../../index.js";
import { HelpText } from "../HelpText.js";
import { GetTokens } from "./GetTokens.js";
import { MarshalledArgsInit } from "./MarshalledArgsInit.js";
import { TokenLoop } from "./TokenLoop.js";

interface CommandContext {
  command: Command;
  subcommandMap: Map<string, Command>;
}

const CommandContext = createContext<CommandContext>();

export function useCommand() {
  return useContext(CommandContext)!;
}

export interface CommandArgParserProps {
  command: Command
}

export function CommandArgParser({ command }: CommandArgParserProps) {
  // map of subcommand name to the operation for that subcommand
  const subcommandMap = new Map<string, Command>();
  for (const subcommand of command.subcommands) {
    subcommandMap.set(subcommand.cli.name, subcommand);
  }

  return (
    <CommandContext.Provider value={{ command, subcommandMap }}>
      <FunctionDeclaration
        name={`parse${command.cli.name}Args`}
        parameters={{ args: "string[]" }}
        refkey={refkey(command, "parseArgs")}
      >
        <GetTokens />
        <MarshalledArgsInit />
        <TokenLoop />
      </FunctionDeclaration>
      <HelpText />
    </CommandContext.Provider>
  );
}
