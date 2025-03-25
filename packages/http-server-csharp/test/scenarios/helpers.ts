/* eslint-disable no-console */
import { ChildProcess, spawn } from "child_process";

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
