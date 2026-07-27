/* eslint-disable no-console */

import { readFile } from "fs/promises";
import { join } from "path";
import pc from "picocolors";

const coverageFilePath = join(
  import.meta.dirname,
  "../../temp",
  "tsp-spector-coverage-javascript-standard.json",
);

/** Calculates and prints Spector coverage from the local coverage artifact. */
export async function calculateCoverage(): Promise<void> {
  try {
    console.log(pc.blue(`Reading coverage file from: ${coverageFilePath}`));
    const data = await readFile(coverageFilePath, "utf8");

    const coverage = JSON.parse(data) as Array<{ results: Record<string, string> }>;

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
