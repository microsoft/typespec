import { refkey } from "@alloy-js/core";
import { FunctionDeclaration, SourceFile } from "@alloy-js/typescript";
import { Command } from "../emitter.js";
import { ControllerInterface } from "./ControllerInterface.js";
import { CommandArgParser } from "./CommandArgParser/CommandArgParser.js";

interface CliParserSourceFileProps {
  command: Command;
}

export function CliParserSourceFile(props: CliParserSourceFileProps) {
  const parsers = [
    <CommandArgParser command={props.command} />
  ]

  for (const subcommand of props.command.subcommands) {
    parsers.push(<CommandArgParser command={subcommand} />);
  }

  return <SourceFile path={props.command.cli.name + ".ts"}>
    <ControllerInterface command={props.command} />

    <FunctionDeclaration export name="parseArgs" parameters={{
      args: "string[]",
      handler: refkey("CommandInterface")
    }}>
      {refkey(props.command, "parseArgs")}(args);
      {parsers}
    </FunctionDeclaration>
  </SourceFile>
}
