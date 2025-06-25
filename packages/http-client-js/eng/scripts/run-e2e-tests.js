/* eslint-disable no-console */
import { exec, spawn } from "child_process";
import fs from "fs";
import http from "http";
import ora from "ora";
import path from "path";
import pc from "picocolors";
import { promisify } from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { calculateCoverage } from "./calculate-coverage.js";
import { runCoverageUpload } from "./upload-spector-results.js";

const execPromise = promisify(exec);
const spinner = ora();
const SERVER_URL = "http://localhost:3000/routes/in-interface/fixed";

// ✅ Setup logging to a file
const logFile = path.join(process.cwd(), "script.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });
const log = (message) => {
  console.log(message);
  logStream.write(`${new Date().toISOString()} - ${message}\n`);
};

// ✅ Parse CLI arguments
// ✅ Parse CLI arguments (Fix for --force-upload)
const argv = yargs(hideBin(process.argv))
  .option("force-upload", {
    alias: "f",
    type: "boolean",
    describe: "Force coverage upload (bypass condition checks)",
    default: false, // Ensure it defaults to false
  })
  .option("test-path", {
    alias: "t",
    type: "string",
    describe: "Specify a test file to run",
  })
  .help()
  .alias("help", "h").argv;

const testPath = argv["test-path"] || argv.t || argv.testPath || "";
const forceUpload = argv["force-upload"] || argv.f || argv.forceUpload;
const vitestArgs = ["vitest", "run"];

if (testPath) {
  vitestArgs.push(testPath);
} else {
  vitestArgs.push(...["--config", "./vitest.config.e2e.ts"]);
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
        spinner.succeed(pc.green(`✅ Server is ready (received 204 from ${url})`));
        return;
      } else {
        log(pc.yellow(`⚠️ Attempt ${attempt}: Received ${res.statusCode}, retrying...`));
      }
    } catch (error) {
      log(pc.gray(`🔄 Attempt ${attempt}: Server not ready yet...`));
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  spinner.fail(pc.red(`❌ Server did not start in time (no 204 from ${url})`));
  throw new Error("Server did not start in time.");
};

/**
 * Main function to start the server, run tests, and stop the server
 */
const runE2eTests = async () => {
  log(pc.blue(pc.bold("\n🚀 Starting mock server...")));
  spinner.start("Launching mock server...");

  // ✅ Start the server using spawn
  const serverProcess = spawn("npm", ["run", "start:server"], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // ✅ Handle logs from server
  serverProcess.stdout.on("data", (data) => log(pc.gray(`[Server] ${data.toString().trim()}`)));
  serverProcess.stderr.on("data", (data) =>
    log(pc.red(`[Server Error] ${data.toString().trim()}`)),
  );

  // ✅ Ensure cleanup on exit
  const stopServer = async () => {
    spinner.start("Shutting down mock server...");
    try {
      await execPromise("pnpm stop:server");
      spinner.succeed(pc.green("✅ Mock server stopped successfully."));
    } catch (err) {
      spinner.fail(pc.red("❌ Failed to stop the server gracefully."));
    }
  };

  process.on("exit", stopServer);
  process.on("SIGINT", async () => {
    log(pc.yellow("\n🛑 Interrupt received, stopping server..."));
    await stopServer();
    process.exit();
  });

  try {
    await waitForServer(SERVER_URL);

    log(pc.green("\n🧪 Running tests...\n"));
    log(pc.cyan(`> ${vitestArgs.join(" ")}`));

    // ✅ Run Vitest and stream output live
    await new Promise((resolve, reject) => {
      const testProcess = spawn("npx", vitestArgs, { stdio: "inherit", shell: true });

      testProcess.on("exit", async (code) => {
        log(pc.yellow("\n🛑 Stopping server..."));
        await stopServer();
        await calculateCoverage(); // ✅ Call calculateCoverage after the server is stopped

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });
    });
  } catch (err) {
    log(pc.red("\n❌ Error:"), err.message);
    await stopServer();
    process.exit(1);
  }
};
const startTime = process.hrtime.bigint(); // ✅ High precision time tracking
let exitCode = 0; // ✅ Track exit status

try {
  await runE2eTests();
  await runCoverageUpload({ force: forceUpload });
} catch (error) {
  log(pc.red(`❌ Fatal Error: ${error.message}`));
  exitCode = 1; // ✅ Mark as failure but do NOT exit yet
} finally {
  // ✅ Ensure time is always logged
  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e9; // Convert to seconds
  console.log(pc.blue(`Total time taken: ${duration.toFixed(2)} seconds`));

  // ✅ Exit after logging (0 = success, 1 = failure)
  process.exit(exitCode);
}
