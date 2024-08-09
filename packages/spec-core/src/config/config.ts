import { readFile } from "fs/promises";
import yaml from "js-yaml";
import { Diagnostic } from "../utils/diagnostic-reporter.js";
import { CadlRanchConfigJsonSchema } from "./config-schema.js";
import { SchemaValidator } from "./schema-validator.js";
import { CadlRanchConfig } from "./types.js";

const validator = new SchemaValidator(CadlRanchConfigJsonSchema);

export async function loadCadlRanchConfig(path: string): Promise<[CadlRanchConfig, Diagnostic[]]> {
  const content = await readFile(path);
  const config: any = yaml.load(content.toString(), { filename: path });
  const diagnostics = validator.validate(config, path);
  return [config, diagnostics];
}
