// @ts-check
import { resolve } from "path";
import scaffoldingJson from "../templates/scaffolding.json" with { type: "json" };

export const templatesDir = resolve(import.meta.dirname, "../templates").replace(/\\/g, "/");

export default {
  baseUri: templatesDir,
  templates: scaffoldingJson,
};
