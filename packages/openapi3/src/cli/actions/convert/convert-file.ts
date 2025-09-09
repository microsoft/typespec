import OpenAPIParser from "@apidevtools/swagger-parser";
import { formatTypeSpec, resolvePath } from "@typespec/compiler";
import { OpenAPI3Document } from "../../../types.js";
import { CliHost } from "../../types.js";
import { handleInternalCompilerError } from "../../utils.js";
import { ConvertCliArgs } from "./args.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";
import { createContext } from "./utils/context.js";

export async function convertAction(host: CliHost, args: ConvertCliArgs) {
  // attempt to read the file
  const fullPath = resolvePath(process.cwd(), args.path);
  const parser = new OpenAPIParser();
  const model = await parser.bundle(fullPath);
  const context = createContext(parser, model as OpenAPI3Document, console);
  const program = transform(context);
  let mainTsp: string;
  try {
    mainTsp = generateMain(program, context);
  } catch (err) {
    handleInternalCompilerError(err);
  }

  let formatError;
  // attempt to format the TSP and track if it threw an error
  try {
    mainTsp = await formatTypeSpec(mainTsp, {
      printWidth: 100,
      tabWidth: 2,
    });
  } catch (err) {
    formatError = err;
  }

  if (args["output-dir"]) {
    await host.mkdirp(args["output-dir"]);
    await host.writeFile(resolvePath(args["output-dir"], "main.tsp"), mainTsp);
  }

  if (formatError) {
    handleInternalCompilerError(formatError);
  }
}
