/* eslint-disable no-console */
import { readFileSync } from "fs";
import { glob } from "fs/promises";
import { dirname, join, resolve } from "pathe";
import { describe, expect, it } from "vitest";
import { Server, getIgnoreList } from "./helpers.js"; // Import the custom Server class
import { runScenario } from "./spector.js"; // Import the runScenario function

const testRoot = __dirname; // Root folder for test cases
const generatedRoot = join(testRoot, "generated"); // Root folder for generated services
const ignoreList = await getIgnoreList(join(testRoot, ".testignore"));

// Get all unique service directories
const allGeneratedServicesList: string[] = [];
for await (const service of glob("**/ServiceProject.csproj", { cwd: generatedRoot })) {
  allGeneratedServicesList.push(dirname(service));
}
const allGeneratedServices = Array.from(new Set(allGeneratedServicesList));

// Filter out ignored services
const services = allGeneratedServices.filter((item) => !ignoreList.includes(`${item}/main.tsp`));

describe("http-specs csharp server tests", () => {
  services.forEach((service) => {
    it(`scenario: ${service}`, async () => {
      const fullServicePath = resolve(join(generatedRoot, service)); // Get the folder path
      const server = new Server(fullServicePath); // Initialize server for this test case

      try {
        console.log(`Starting server in folder: ${service}`);
        await server.start(); // Start the .NET server

        // Extract http url from service launchSettings.json
        const launchSettingsPath = join(fullServicePath, "Properties/launchSettings.json");
        const launchSettings = JSON.parse(readFileSync(launchSettingsPath, "utf-8"));

        // Please note that spector does not support HTTPS yet
        const baseUrl = launchSettings.profiles.http.applicationUrl;

        const { status } = await runScenario(`${service}/**/*`, baseUrl);
        expect(status).toBe("pass");
      } finally {
        server.stop(); // Stop the dotnet server
      }
    });
  });
});
