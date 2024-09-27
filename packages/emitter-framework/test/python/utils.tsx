import { Children, Output, OutputDirectory, OutputFile, render } from "@alloy-js/core";
import { PythonProject } from "../../src/python/index.js";
import { Program } from "@typespec/compiler";
import { getProgram } from "../utils.js";

export async function getEmitOutput(tspCode: string, cb: (program: Program) => Children) {
  const program = await getProgram(tspCode);
  const res = render(
    <Output>
      <PythonProject name="test_project" version="0.1.0" children={cb(program)} />
    </Output>
  );
  
  const testFile = findFile(res, "test_project/test_package/test.py");
  return testFile.contents;
}

function findFile(res: OutputDirectory, path: string): OutputFile {
  const result = findFileWorker(res, path);
  if (!result) {
    throw new Error("Expected to find file " + path);
  }
  return result;
}

function findFileWorker(res: OutputDirectory, path: string): OutputFile | null {
  for (const item of res.contents) {
    if (item.kind === "file") {
      if (item.path.includes(path)) {
        return item;
      }
      continue;
    } else {
      const found = findFileWorker(item, path);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
