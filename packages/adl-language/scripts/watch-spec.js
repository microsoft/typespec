import watch from "watch";
import ecmarkup from "ecmarkup";
import { readFile } from "fs/promises";
import { runWatch } from "../../../eng/scripts/helpers.js";
import { resolve } from "path";

async function build() {
  const infile = resolve("src/spec.emu.html");
  const outfile = resolve("../../docs/spec.html");
  const fetch = (path) => readFile(path, "utf-8");

  try {
    await ecmarkup.build(infile, fetch, { outfile });
  } catch (err) {
    console.log(`${infile}(1,1): error EMU0001: Error generating spec: ${err.message}`);
    throw err;
  }
}

runWatch(watch, "src", build);
