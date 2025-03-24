/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { Server } from "./helpers.js"; // Import the custom Server class
import { runScenario } from "./spector.js"; // Import the runScenario function

const testRoot = path.join(__dirname, "test-cases"); // Root folder for test cases
const folders = fs
  .readdirSync(testRoot)
  .filter((f) => fs.statSync(path.join(testRoot, f)).isDirectory());

describe("Process all http-specs scenarios ", () => {
  folders.forEach((folder) => {
    it(`should start and stop processes for folder: ${folder}`, async () => {
      const folderPath = path.join(testRoot, folder);

      console.log(`Running tests in folder: ${folder}`);

      const server = new Server(folderPath); // Initialize server for this test case

      try {
        await server.start(); // Start the .NET server

        console.log(`Running server tests for ${folder}`);

        // TODO: This is the only place where the baseUrl is hardcoded
        const { status } = await runScenario("parameters/basic/**/*", "https://localhost:8443");
        expect(status).toBe("pass");
      } finally {
        server.stop(); // Stop the dotnet server
      }
    });
  });
});
