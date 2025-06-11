#!/usr/bin/env node

/**
 * Standalone script to create PR in azure-sdk-for-net repository
 * This script reads arguments from command line and creates a PR to update the http-client-csharp dependency
 */

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createAzureSdkForNetPr } from "../lib/create-azure-sdk-for-net-pr.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    options[key] = value;
  }

  // Validate required options
  const required = ['packagePath', 'pullRequestUrl', 'packageUrl', 'githubToken'];
  for (const field of required) {
    if (!options[field]) {
      console.error(`Missing required option: --${field}`);
      process.exit(1);
    }
  }

  try {
    await createAzureSdkForNetPr(options);
    console.log('PR creation completed successfully');
  } catch (error) {
    console.error('Failed to create PR:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});