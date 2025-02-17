/* eslint-disable no-console */
import chalk from "chalk";
import { exec, spawn } from "child_process";
import http from "http";
import ora from "ora";
import { promisify } from "util";
import { calculateCoverage } from "./calculate-coverage.js";

const execPromise = promisify(exec);
const SERVER_URL = "http://localhost:3000/routes/in-interface/fixed"; // Endpoint to check if server is up and running
const spinner = ora();
// Get test path argument from CLI (e.g., `npm run test:e2e my/test/path`)
const testPath = process.argv[2] || ""; // Default: Run all tests if no path is provided
const vitestArgs = ["run"];
if (testPath) {
  vitestArgs.push(testPath);
} else {
  vitestArgs.push("test/e2e");
}

/**
 * Waits until the mock server responds with HTTP 204 on /routes
 */
const waitForServer = async (url, retries = 20, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(url, resolve).on("error", reject);
      });

      if (res.statusCode === 204) {
        spinner.succeed(chalk.green(`✅ Server is ready (received 204 from ${url})`));
        return;
      } else {
        console.log(chalk.yellow(`⚠️ Attempt ${attempt}: Received ${res.statusCode}, retrying...`));
      }
    } catch (error) {
      console.log(chalk.gray(`🔄 Attempt ${attempt}: Server not ready yet...`));
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  spinner.fail(chalk.red(`❌ Server did not start in time (no 204 from ${url})`));
  throw new Error("Server did not start in time.");
};

/**
 * Main function to start the server, run tests, and stop the server
 */
const main = async () => {
  console.log(chalk.blue.bold("\n🚀 Starting mock server..."));
  spinner.start("Launching mock server...");

  // Start the server using spawn to handle background processes
  const serverProcess = spawn("npm", ["run", "start:server"], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(chalk.gray(`[Server] ${data.toString().trim()}`));
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(chalk.red(`[Server Error] ${data.toString().trim()}`));
  });

  try {
    await waitForServer(SERVER_URL);

    console.log(chalk.green("\n🧪 Running tests...\n"));
    console.log(chalk.cyan(`> vitest ${vitestArgs.join(" ")}`));

    // Run Vitest with path argument (if provided) and stream output live
    const testProcess = spawn("vitest", vitestArgs, { stdio: "inherit", shell: true });

    testProcess.on("exit", async (code) => {
      console.log(chalk.yellow("\n🛑 Stopping server..."));
      spinner.start("Shutting down mock server...");
      await execPromise("npm run stop:server");
      spinner.succeed(chalk.green("✅ Mock server stopped successfully."));
      await calculateCoverage(); // Call calculateCoverage after the server is stopped
      process.exit(code);
    });
  } catch (err) {
    console.error(chalk.red("\n❌ Error:"), err.message);
    await execPromise("npm run stop:server").catch(() => {});
    process.exit(1);
  } finally {
    serverProcess.kill(); // Ensure server stops even if something fails
  }
};

await main();
// await calculateCoverage(); // Call calculateCoverage after the server is stopped
