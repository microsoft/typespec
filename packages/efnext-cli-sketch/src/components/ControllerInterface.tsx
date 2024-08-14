/* eslint-disable unicorn/filename-case */
import { Operation, Type, navigateType } from "@typespec/compiler";
import { isDeclaration } from "@typespec/emitter-framework";
import {
  InterfaceDeclaration,
  InterfaceMember,
  TypeDeclaration,
} from "@typespec/emitter-framework/typescript";
import { useHelpers } from "../helpers.js";
import { CliType, Command } from "../index.js";
import { mapJoin } from "@alloy-js/core";

export interface ControllerInterfaceProps {
  command: Command;
}

export function ControllerInterface({ command }: ControllerInterfaceProps) {
  const commands: Command[] = [command, ... command.subcommands]
    .filter(command => command.cli.kind === "Operation");

  // collect types from the root CLI command (which should include types from any subcommands)
  const typeDecls = collectTypeDecls(command.cli).map((type) => <TypeDeclaration type={type} />);

  const memberDecls = mapJoin(commands, (command) => {
    return <InterfaceMember type={command.cli as Operation} />;
  });

  return (
    <>
      <InterfaceDeclaration name="CommandInterface">
        {`${command.cli.name}(): void;`}
        {memberDecls}
        version: string;
      </InterfaceDeclaration>
      {typeDecls}
    </>
  );
}

// todo: make this better.
function collectTypeDecls(root: Type) {
  const types: Type[] = [];
  navigateType(
    root,
    {
      model(m) {
        if (isDeclaration(m)) {
          types.push(m);
        }
      },
    },
    {}
  );

  return types;
}
