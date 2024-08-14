import {
  EmitContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Union,
} from "@typespec/compiler";
import { Output } from "@alloy-js/core";
import { node} from "@alloy-js/typescript";
import { HelperContext, getStateHelpers } from "./helpers.js";
import { CLITable3 } from "./dependencies.js";
import { CliParserSourceFile } from "./components/CliParserSourceFile.js";

export type CliType = Namespace | Interface | Operation;

export interface Command {
  cli: CliType;
  subcommands: Command[];
  options: Map<ModelProperty, string>;
}

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }

  const helpers = getStateHelpers(context);
  const commands = collectCommands(helpers);
  const cliSfs = commands.map(
    command => <CliParserSourceFile command={command} />
  );


  return <Output externals={[CLITable3, node.util]} basePath={context.emitterOutputDir}>
    <HelperContext.Provider value={helpers}>{cliSfs}</HelperContext.Provider>
  </Output>
}

export function collectCommands(helpers: ReturnType<typeof getStateHelpers>): Command[] {
  const commands: Command[] = [];
  const clis = helpers.listClis() as CliType[];

  for (const cli of clis) {
    if (cli.kind === "Namespace" || cli.kind === "Interface") {
      const command: Command = {
        cli,
        subcommands: [],
        options: collectCommandOptions(cli)
      }

      for (const subCli of cli.operations.values()) {
        const subcommand = {
          cli: subCli,
          subcommands: [],
          options: collectCommandOptions(subCli)
        }

        command.subcommands.push(subcommand);
      }

      commands.push(command);
    } else {
      commands.push({
        cli: (helpers.toOptionsBag(cli).type as Operation),
        subcommands: [],
        options: collectCommandOptions(cli)
      })
    }
  }

  return commands;
}

export function collectCommandOptions(command: CliType): Map<ModelProperty, string> {
  if (command.kind === "Namespace" || command.kind === "Interface") {
    // TODO: find the root command operation
    return new Map();
  }
  const commandOpts = new Map<ModelProperty, string>();

  const types: [Model | Union, string, boolean?][] = [[command.parameters, "", true]];

  while (types.length > 0) {
    const [type, path, topLevel] = types.pop()!;

    if (type.kind === "Model") {
      let index = 0;
      for (const param of type.properties.values()) {
        const paramPath = topLevel ? `[${index}]` : `${path}.${param.name}`;
        if (param.type.kind === "Model") {
          types.push([param.type, paramPath]);
        } else if (
          param.type.kind === "Union" &&
          [...param.type.variants.values()].find((v) => v.type.kind === "Model")
        ) {
        } else {
          commandOpts.set(param, paramPath);
        }

        index++;
      }
    } else if (type.kind === "Union") {
      for (const variant of type.variants.values()) {
        if (variant.type.kind === "Union" || variant.type.kind === "Model") {
          types.push([variant.type, path]);
        }
      }
    }
  }

  return commandOpts;
}

