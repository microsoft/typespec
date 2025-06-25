/* eslint-disable no-console */
import { ChildProcess, spawn } from "child_process";
import { readFile } from "fs/promises";
import pc from "picocolors";
export class Server {
  private process: ChildProcess | null = null;

  constructor(private workDir: string) {}

  async start(): Promise<void> {
    console.log(`Starting ASP.NET server in ${this.workDir}...`);

    this.process = spawn("dotnet", ["run", "--launch-profile", "http"], {
      cwd: this.workDir,
      stdio: "ignore", // Disable stdio output
    });

    // Wait for server to initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!this.process.pid) {
      throw new Error("Failed to start server");
    }

    console.log(`Server started with PID: ${this.process.pid}`);
  }

  stop(): void {
    if (this.process && !this.process.killed) {
      console.log(`Stopping ASP.NET server with PID: ${this.process.pid}...`);
      this.process.kill("SIGTERM"); // Gracefully terminate
    }
  }
}

/**
 * Reads and parses the ignore file to return a list of ignored patterns.
 * @param {string} ignoreFilePath - The path to the ignore file.
 * @returns {Promise<string[]>} A promise that resolves to an array of ignore patterns.
 */
export async function getIgnoreList(ignoreFilePath: string): Promise<string[]> {
  try {
    const content = await readFile(ignoreFilePath, "utf8");
    return content
      .split(/\r?\n/) // Split by newlines
      .filter((line) => line.trim() && !line.startsWith("#")) // Remove empty lines and comments
      .map((line) => line.trim()); // Trim each line
  } catch {
    console.warn(pc.yellow("No ignore file found at: " + ignoreFilePath));
    return [];
  }
}
