/* eslint-disable no-console */
import { resolvePath } from "@typespec/compiler";
import { spawn } from "cross-spawn";
import path from "path";
import pc from "picocolors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getFreePort } from "../lib/utils.js";

async function main() {
  console.log(`TypeSpec Http Server Emitter for C-Sharp \n`);

  await yargs(hideBin(process.argv))
    .scriptName("hscs-scaffold")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .command(
      "$0 <path-to-spec> [--output <project-directory>] [--use-swaggerui] [OPTIONS]",
      "Create an ASP.Net server project",
      (cmd) => {
        return cmd
          .option("use-swaggerui", {
            description:
              "Include generated OpenAPI and a SwaggerUI endpoint in the service project.  THIS OPTION REQUIRES '@typespec/openapi3' as a dependency of your typespec project.",
            type: "boolean",
            default: false,
          })
          .option("project-name", {
            description: "The name of the generated project.",
            type: "string",
            default: "ServiceProject",
          })
          .option("http-port", {
            description: "The http port for the generated project to use locally",
            type: "number",
          })
          .option("https-port", {
            description: "The https port for the generated service to listen on locally.",
            type: "number",
          })
          .option("overwrite", {
            description: "Overwrite existing mock implementations and project files",
            type: "boolean",
            default: true,
          })
          .option("output", {
            description: "Path to the directory where the project will be created.",
            type: "string",
          })
          .positional("path-to-spec", {
            description: "The path to the TypeSpec spec or TypeSpec project directory",
            type: "string",
            demandOption: true,
          });
      },
      async (args) => {
        const projectDir =
          args["output"] !== undefined ? resolvePath(process.cwd(), args["output"]) : undefined;
        const pathToSpec = resolvePath(process.cwd(), args["path-to-spec"]);
        const useSwagger: boolean = args["use-swaggerui"];
        const overwrite: boolean = args["overwrite"];
        const projectName: string = args["project-name"];
        const httpPort: number = args["http-port"] || (await getFreePort(5000, 5999));
        const httpsPort: number = args["https-port"] || (await getFreePort(7000, 7999));
        console.log(
          pc.bold("Compiling spec to create ASP.Net core project with mock implementations"),
        );
        console.log(pc.bold(`using http port ${httpPort} and https port ${httpsPort}`));
        const compileArgs: string[] = [
          "tsp",
          "compile",
          pathToSpec,
          "--emit",
          "@typespec/http-server-csharp",
          "--option",
          "@typespec/http-server-csharp.emit-mocks=mocks-and-project-files",
          "--option",
          `@typespec/http-server-csharp.project-name=${projectName}`,
          "--trace",
          "http-server-csharp",
        ];
        if (overwrite) {
          compileArgs.push("--option", "@typespec/http-server-csharp.overwrite=true");
        }
        if (httpPort) {
          compileArgs.push("--option", `@typespec/http-server-csharp.http-port=${httpPort}`);
        }
        if (httpsPort) {
          compileArgs.push("--option", `@typespec/http-server-csharp.https-port=${httpsPort}`);
        }

        const swaggerArgs: string[] = [
          "--emit",
          "@typespec/openapi3",
          "--option",
          "@typespec/http-server-csharp.use-swaggerui=true",
        ];
        if (projectDir) {
          const generatedTargetDir = resolvePath(process.cwd(), projectDir);
          const generatedOpenApiDir = resolvePath(process.cwd(), projectDir, "openapi");
          const openApiPath = path
            .relative(projectDir, resolvePath(generatedOpenApiDir, "openapi.yaml"))
            .replaceAll("\\", "/");
          compileArgs.push(
            "--option",
            `@typespec/http-server-csharp.emitter-output-dir=${generatedTargetDir}`,
          );
          swaggerArgs.push(
            "--option",
            `@typespec/openapi3.emitter-output-dir=${generatedOpenApiDir}`,
            "--option",
            `@typespec/http-server-csharp.openapi-path=${openApiPath}`,
          );
        }

        if (useSwagger) compileArgs.push(...swaggerArgs);
        const result = await runScriptAsync("npx", compileArgs);
        if (result === 0) {
          console.log(pc.bold(`Your project was successfully created`));
        } else {
          console.log(pc.bold("There were one or more errors"));
          if (useSwagger) {
            console.log(
              "You must have @typespec/openapi3 as a dependency in your typespec project for use of SwaggerUI. ",
            );
          }
        }
      },
    ).argv;
}

function internalError(error: unknown) {
  // NOTE: An expected error, like one thrown for bad input, shouldn't reach
  // here, but be handled somewhere else. If we reach here, it should be
  // considered a bug and therefore we should not suppress the stack trace as
  // that risks losing it in the case of a bug that does not repro easily.
  console.log(error);
}

function processStream(input: string | number | null | undefined): string {
  if (input === undefined || input === null) return "";
  const data = `${input}`;
  const lines = data.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const token = "hscs-msg:";
    const extraChars = token.length;
    if (line.includes(token) && line.includes("trace")) {
      const endPos = line.indexOf(token) + extraChars;
      result.push(pc.bold(line.substring(endPos)));
    } else {
      result.push(pc.dim(line));
    }
  }
  return result.join("\n");
}

function runScriptAsync(cmd: string, args: string[]): Promise<number> {
  let resolver: (value: number | PromiseLike<number>) => void;
  const promise = new Promise<number>((resolve, _) => {
    resolver = resolve;
  });
  console.log(pc.green(`> ${cmd} ${args.join(" ")}`));
  const proc = spawn(cmd, args);
  proc.stdout?.on("data", (data) => {
    console.log(processStream(data));
  });
  proc.stderr?.on("data", (data) => {
    console.log(processStream(data));
  });
  proc.on("close", (_, __) => {
    resolver(proc.exitCode || 0);
  });

  return promise;
}

process.on("unhandledRejection", (error: unknown) => {
  console.error("Unhandled promise rejection!");
  internalError(error);
});

main().catch(internalError);
