/* eslint-disable unicorn/filename-case */
import { ModelProperty } from "@typespec/compiler";
import { code } from "@alloy-js/core";
import { FunctionDeclaration } from "@typespec/emitter-framework/typescript";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import pc from "picocolors";
import stripAnsi from "strip-ansi";
import { useHelpers } from "../helpers.js";
import { CliType } from "../index.js";
import { useCommand } from "./CommandArgParser/CommandArgParser.js";
import { CLITable3 } from "../dependencies.js";
import { Reference } from "@alloy-js/typescript";

function removeHashAndBold(s: string) {
  return pc.bold(s.replace(/^#+ /, ""));
}

marked.use(
  markedTerminal({
    paragraph: (s: string) => {
      return s.replace(/\n/g, " ");
    },
    firstHeading: removeHashAndBold,
    heading: removeHashAndBold,
  }) as any
);
marked.use({
  breaks: false,
});

export interface HelpTextProps {}

// TODO: Accumulate output in an array, join, and write with process.stdout.write.
// output code should be a clsoe to a single process.stdout.write with a string.
// although the tables will make that impossible to do entirely.

// eslint-disable-next-line no-empty-pattern
export function HelpText({}: HelpTextProps) {
  const { command, options, subcommandMap } = useCommand();
  const helpers = useHelpers();
  const commandDoc = helpers.getDoc(command);
  const commandDesc = commandDoc
    ? ((marked(commandDoc) as string).trimEnd() + "\n").replace(/\n/g, "\\n").replace(/"/g, '\\"')
    : "";
  const helpTable = [...options.keys()]
    .sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0))
    .map((o) => pushOptionHelp(o))
    .join("");

  const subcommandHelp = [];
  if (subcommandMap.size > 0) {
    subcommandHelp.push(code`
      const subcommandTable = new ${<Reference refkey={CLITable3.default} />}({
        chars: noFormatting,
      });
    `)
    subcommandHelp.push(... [...subcommandMap.entries()]
      .map(([name, cli]) => {
        return pushSubcommandHelp(name, cli);
      }))

    subcommandHelp.push(code`
      console.log(\`\\n${pc.bold("Subcommands\n")}\`);
      console.log(subcommandTable.toString());
    `);
  }
  return (
    <FunctionDeclaration 
      name={`${command.name}Help`}
      parameters={{ "noColor?": "boolean" }}>
      {code`
        if (noColor || process.env["NO_COLOR"]) {
          console.log("${command.name} " + handler.version + "\\n");
          console.log("${stripAnsi(commandDesc)}");
        } else {
          console.log("${command.name} \" + handler.version + \"\\n");
          console.log("${commandDesc}");
        }

        const noFormatting = {
          top: "",
          "top-mid": "",
          "top-left": "",
          "top-right": "",
          "mid-mid": "",
          mid: "",
          middle: "",
          bottom: "",
          "bottom-mid": "",
          "bottom-left": "",
          "bottom-right": "",
          left: "",
          "left-mid": "",
          right: "",
          "right-mid": "",
        };

        const table = new ${<Reference refkey={CLITable3.default} />}({
          chars: noFormatting,
        });
        table.push(["--help, -h", "Display this help message."])
        ${helpTable}
        console.log(\`${pc.bold("Options\n")}\`);
        console.log(table.toString());
        ${subcommandHelp}
      `}
    </FunctionDeclaration>
  );

  function pushOptionHelp(option: ModelProperty) {
    let options = `--${option.name}`;

    if (helpers.option.isInvertable(option)) {
      options += `, --no-${option.name}`;
    }

    if (helpers.option.hasShortName(option)) {
      options += `, -${helpers.option.getShortName(option)}`;
    }

    return `table.push([\`${options}\`, \`${helpers.getDoc(option)}\`]);`;
  }

  function pushSubcommandHelp(name: string, cli: CliType) {
    return `subcommandTable.push(["${name}", \`${helpers.getDoc(cli)}\`]);`;
  }
}
