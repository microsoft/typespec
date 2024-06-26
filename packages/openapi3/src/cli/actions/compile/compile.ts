import oaParser from "@readme/openapi-parser";
import { resolve } from "path";
import { OpenAPI3Document } from "../../../types.js";
import { CliHost } from "../../types.js";
import { handleInternalCompilerError } from "../../utils.js";
import { CompileCliArgs } from "./args.js";
import { emitMain } from "./emitters/emit-main.js";
import { transform } from "./transforms/transforms.js";

export async function compileAction(host: CliHost, args: CompileCliArgs & { path: string }) {
  // attempt to read the file
  const fullPath = resolve(process.cwd(), args.path);
  const model = (await parseOpenApiFile(fullPath)) as OpenAPI3Document;
  const program = transform(model);
  let mainTsp: string;
  try {
    mainTsp = await emitMain(program);
  } catch (err) {
    handleInternalCompilerError(err);
  }

  if (args["output-dir"]) {
    await host.mkdirp(args["output-dir"]);
    await host.writeFile(resolve(args["output-dir"], "main.tsp"), mainTsp);
  } else if (args["output-path"]) {
    await host.writeFile(resolve(args["output-path"], "main.tsp"), mainTsp);
  }
}

function parseOpenApiFile(path: string) {
  return oaParser.bundle(path);
}
