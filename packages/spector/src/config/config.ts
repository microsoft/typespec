import { readFile } from "fs/promises";
import yaml from "js-yaml";
import { Diagnostic } from "../utils/diagnostic-reporter.js";
import { SpecConfigJsonSchema } from "./config-schema.js";
import { SchemaValidator } from "./schema-validator.js";
import { SpecConfig } from "./types.js";

const validator = new SchemaValidator(SpecConfigJsonSchema);

export async function loadSpecConfig(path: string): Promise<[SpecConfig, Diagnostic[]]> {
  const content = await readFile(path);
  const config: any = yaml.load(content.toString(), { filename: path });
  const diagnostics = validator.validate(config, path);
  return [config, diagnostics];
}
