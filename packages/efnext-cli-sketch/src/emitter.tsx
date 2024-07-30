import {
  EmitContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Union,
} from "@typespec/compiler";
import { Output, code } from "@alloy-js/core";
import { ObjectExpression, SourceFile } from "@alloy-js/typescript";
import { CommandArgParser } from "./components/CommandArgParser/CommandArgParser.js";
import { ControllerInterface } from "./components/ControllerInterface.js";
import { HelperContext, getStateHelpers } from "./helpers.js";

export type CliType = Namespace | Interface | Operation;

export async function $onEmit(context: EmitContext) {
  const helpers = getStateHelpers(context);
  if (context.program.compilerOptions.noEmit) {
    return;
  }

  const clis = helpers.listClis() as CliType[];
  const cliSfs = [];

  for (let cli of clis) {
    const subCommandClis =
      cli.kind === "Namespace" || cli.kind === "Interface" ? [...cli.operations.values()] : [];

    const parsers = [cli, ...subCommandClis].map((cli) => {
      const mutatedCli =
        cli.kind === "Operation" ? (helpers.toOptionsBag(cli).type as Operation) : cli;
      const options = collectCommandOptions(mutatedCli);
      return <CommandArgParser command={mutatedCli} options={options} />;
    });

    cliSfs.push(
      <SourceFile path={cli.name + ".ts"}>
        {code`
          import { parseArgs as nodeParseArgs } from "node:util";
          import Table from "cli-table3";
        `}
        <ControllerInterface cli={cli} />

        {code`
          export function parseArgs(args: string[], handler: CommandInterface) {
            parse${cli.name}Args(args);
            ${parsers}
          }`}
      </SourceFile>
    );
  }

  return <Output>
    <SourceFile path="test.ts">
      object:
        <ObjectExpression jsValue={{a: 1, b: 2}} />
    </SourceFile>
  </Output>
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
