// import { ChildProcess, spawn } from "child_process";
// import { logger } from "logger";

// interface ServerConfig {
//   name: string;
//   scaffoldCommand: string;
//   startCommand: string;
//   workingDirectory: string;
// }

// export class CustomServerManager {
//   private serverProcess: ChildProcess | null = null;

//   public async scaffold(): Promise<void> {
//     logger.info(`Scaffolding ${this.config.name}...`);
//     await this.executeCommand(this.config.scaffoldCommand);
//     logger.info(`${this.config.name} scaffolding completed.`);
//   }

//   public start(): void {
//     if (this.serverProcess) {
//       logger.warn(`${this.config.name} is already running.`);
//       return;
//     }

//     logger.info(`Starting ${this.config.name}...`);
//     const [command, ...args] = this.config.startCommand.split(" ");
//     this.serverProcess = spawn(command, args, {
//       cwd: this.config.workingDirectory,
//       stdio: "inherit",
//     });

//     this.serverProcess.on("close", (code) => {
//       logger.info(`${this.config.name} exited with code ${code}`);
//       this.serverProcess = null;
//       this.emit("stopped", code);
//     });

//     this.emit("started");
//   }

//   public stop(): void {
//     if (!this.serverProcess) {
//       logger.warn(`${this.config.name} is not running.`);
//       return;
//     }

//     logger.info(`Stopping ${this.config.name}...`);
//     this.serverProcess.kill();
//   }

//   private executeCommand(command: string): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const [cmd, ...args] = command.split(" ");
//       const process = spawn(cmd, args, {
//         cwd: this.config.workingDirectory,
//         stdio: "inherit",
//       });

//       process.on("close", (code) => {
//         if (code === 0) {
//           resolve();
//         } else {
//           reject(new Error(`Command "${command}" exited with code ${code}`));
//         }
//       });
//     });
//   }
// }
