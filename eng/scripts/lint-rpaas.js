import { exec } from "child_process";
import * as yaml from "js-yaml";
import { scanSwaggers } from "./helpers.js";
class LintErrorParser {
  results;
  AutoRestErrors = [
    '{\n  "Channel": "error"',
    '{\n  "Channel": "fatal"',
    "Process() cancelled due to exception",
  ];
  constructor(output) {
    this.results = this.cleanUp(output);
  }

  cleanUp(s) {
    let resultString = s.replace(/}\nProcessing batch task - {\"package-(.*).\n{/g, "},{");
    resultString = resultString.replace(/{"package-(.*)} .\n/, "");
    resultString = resultString.replace(/\nProcessing batch task(.*)./g, "");
    return s;
  }

  getLintResult() {
    const regexLintResult = /\{\n  "type": "[\s\S]*?\n\}/gi;
    let results = [];
    let matches;
    while ((matches = regexLintResult.exec(this.results))) {
      const oneMessage = yaml.load(matches[0]);
      if (oneMessage) {
        results.push(oneMessage);
      } else {
        console.log("The linter output message has invalid format:", matches[0]);
      }
    }
    return JSON.stringify(results);
  }

  isAutorestFailed() {
    return this.AutoRestErrors.some((error) => this.results.indexOf(error) !== -1);
  }

  getAutoRestError() {
    if (this.isAutorestFailed()) {
      const regexLintResult = /\{\n  "type": "[\s\S]*?\n\}/gi;
      return this.results.replace(regexLintResult, "");
    }
    return "";
  }
}

const suppressedErrors = [
  {
    id: "D5001",
    code: "XmsExamplesRequired",
  },
];

async function lintInternal(swagger) {
  const cmd = [
    "npx",
    "autorest",
    "--validation",
    "--azure-validator",
    "--message-format=json",
    "--openapi-type=arm",
    "--use=@microsoft.azure/classic-openapi-validator@latest",
    "--use=@microsoft.azure/openapi-validator@latest",
    "--openapi-subtype=providerHub",
    "--input-file=" + swagger,
  ].join(" ");
  const { err, stdout, stderr } = await new Promise((res) =>
    exec(cmd, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }, (err, stdout, stderr) =>
      res({ err, stdout, stderr })
    )
  );
  let resultString = stderr + stdout;
  if (resultString.indexOf("{") !== -1) {
    resultString = resultString.replace(/Processing batch task - {.*} \.\n/g, "");
  }
  const parser = new LintErrorParser(resultString);
  return parser;
}

function filterSuppressed(results) {
  const isSuppressed = (x) => suppressedErrors.some((y) => x.id === y.id && x.code === y.code);
  return results.filter((x) => !isSuppressed(x));
}

async function lintSwagger(swagger) {
  const r = await lintInternal(swagger);
  let success = true;
  if (r.isAutorestFailed()) {
    console.log("autorest errors:");
    console.log(r.getAutoRestError());
    success = false;
  } else {
    const lintResults = JSON.parse(r.getLintResult());
    const res = filterSuppressed(lintResults);
    const errors = res.filter((x) => x.type === "Error");
    const warnings = res.filter((x) => x.type === "Warning");
    if (errors.length > 0) {
      console.error(errors.length, " errors detected as below:");
      console.log(errors);
      success = false;
    }
    console.log("\n\n");
    if (warnings.length > 0) {
      console.warn(warnings.length, " warnings detected as below:");
      console.warn(warnings);
    }
  }
  return success;
}

async function main() {
  const roots = process.argv[2].split(";");
  const paths = roots.flatMap((root) => scanSwaggers(root));
  console.log("Scanned following swaggers:", paths);
  const errorPaths = [];
  for (const p of paths) {
    console.log("Run LintRPaaS for", p);
    const success = await lintSwagger(p);
    if (!success) {
      errorPaths.push(p);
    }
    console.log("\n\n\n");
  }
  if (errorPaths.length > 0) {
    console.error("Please fix errors for following files:");
    console.error(errorPaths);
    process.exit(1);
  }
}

main();
