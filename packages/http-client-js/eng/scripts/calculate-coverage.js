/* eslint-disable no-console */

import chalk from "chalk";
import { readFile } from "fs/promises";
import { dirname, join } from "path";
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
    console.log(chalk.blue(`Reading coverage file from: ${coverageFilePath}`));
    const data = await readFile(coverageFilePath, "utf8");

    const coverage = JSON.parse(data);

    const results = coverage[0].results;
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter((status) => status === "pass").length;

    const coveragePercentage = (passedTests / totalTests) * 100;

    console.log(chalk.bold.gray(`Total Tests: ${totalTests}`));
    console.log(chalk.bold.green(`Passed Tests: ${passedTests}`));
    console.log(chalk.bold.green(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`));
  } catch (error) {
    console.error(chalk.red("Error calculating coverage:"), error);
  }
}
