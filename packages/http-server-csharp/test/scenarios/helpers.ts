/* eslint-disable no-console */
import { ChildProcess, spawn } from "child_process";

export class Server {
  private process: ChildProcess | null = null;

  constructor(private workDir: string) {}

  async start(): Promise<void> {
    console.log(`Starting server in ${this.workDir}...`);

    this.process = spawn("dotnet", ["run"], {
      cwd: this.workDir,
      stdio: "inherit",
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
      console.log(`Stopping server with PID: ${this.process.pid}...`);
      this.process.kill("SIGTERM"); // Gracefully terminate
    }
  }
}
