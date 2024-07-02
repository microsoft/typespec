import oaParser from "@readme/openapi-parser";
import { resolvePath } from "@typespec/compiler";
import { OpenAPI3Document } from "../../../types.js";
import { CliHost } from "../../types.js";
import { handleInternalCompilerError } from "../../utils.js";
import { ConvertCliArgs } from "./args.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";

export async function convertAction(host: CliHost, args: ConvertCliArgs & { path: string }) {
  // attempt to read the file
  const fullPath = resolvePath(process.cwd(), args.path);
  const model = await parseOpenApiFile(fullPath);
  const program = transform(model);
  let mainTsp: string;
  try {
    mainTsp = await generateMain(program);
  } catch (err) {
    handleInternalCompilerError(err);
  }

  if (args["output-dir"]) {
    await host.mkdirp(args["output-dir"]);
    await host.writeFile(resolvePath(args["output-dir"], "main.tsp"), mainTsp);
  }
}

function parseOpenApiFile(path: string): Promise<OpenAPI3Document> {
  return oaParser.bundle(path) as Promise<OpenAPI3Document>;
}
