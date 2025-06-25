import { readFile } from "fs/promises";
import { resolve } from "path";

const grammarPath = resolve(import.meta.dirname, "../../../../grammars/typespec.json");
const tspGrammar = JSON.parse((await readFile(grammarPath)).toString());

export const TypeSpecLang = {
  ...tspGrammar,
  id: "typespec",
  scopeName: "source.tsp",
  path: grammarPath,
  aliases: ["tsp"],
};
