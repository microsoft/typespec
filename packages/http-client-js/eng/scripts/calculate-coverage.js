/* eslint-disable no-console */

import { readFile } from "fs/promises";
import { dirname, join } from "path";
import pc from "picocolors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const coverageFilePath = join(
  __dirname,
  "../../temp",
  "tsp-spector-coverage-javascript-standard.json",
);

export async function calculateCoverage() {
  try {
    console.log(pc.blue(`Reading coverage file from: ${coverageFilePath}`));
    const data = await readFile(coverageFilePath, "utf8");

    const coverage = JSON.parse(data);

    const results = coverage[0].results;
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter((status) => status === "pass").length;

    const coveragePercentage = (passedTests / totalTests) * 100;

    console.log(pc.bold(pc.gray(`Total Tests: ${totalTests}`)));
    console.log(pc.bold(pc.green(`Passed Tests: ${passedTests}`)));
    console.log(pc.bold(pc.green(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`)));
  } catch (error) {
    console.error(pc.red("Error calculating coverage:"), error);
  }
}
