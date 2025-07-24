#!/usr/bin/env node

/**
 * Script to add launch settings profile for easy debugging of TypeSpec generation
 * 
 * This script:
 * 1. Installs tsp-client if not already installed
 * 2. Runs tsp-client sync in the target SDK directory
 * 3. Runs tsp-client generate --save-inputs to create tspCodeModel.json
 * 4. Adds a new debug profile to launchSettings.json that targets the DLL
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import { resolve, join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to run commands and get output
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Helper function to check if a command exists
function commandExists(command) {
  try {
    runCommand(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Check if tsp-client is installed
function isTspClientInstalled() {
  try {
    runCommand('tsp-client --version');
    return true;
  } catch {
    return false;
  }
}

// Install tsp-client globally
function installTspClient() {
  console.log('Installing @azure-tools/typespec-client-generator-cli...');
  runCommand('npm install -g @azure-tools/typespec-client-generator-cli');
  console.log('tsp-client installed successfully.');
}

// Run tsp-client commands in the target directory
async function runTspClientCommands(sdkDirectory) {
  console.log(`Running tsp-client commands in ${sdkDirectory}...`);
  
  // Change to the SDK directory and run commands
  const originalCwd = process.cwd();
  
  try {
    process.chdir(sdkDirectory);
    
    console.log('Running tsp-client sync...');
    try {
      runCommand('tsp-client sync');
    } catch (error) {
      console.warn('Warning: tsp-client sync failed. This might be expected if the directory is not a proper TypeSpec SDK directory.');
      console.warn('Error:', error.message);
    }
    
    console.log('Running tsp-client generate --save-inputs...');
    try {
      runCommand('tsp-client generate --save-inputs');
    } catch (error) {
      console.warn('Warning: tsp-client generate failed. This might be expected if the directory is not a proper TypeSpec SDK directory.');
      console.warn('Error:', error.message);
    }
    
    console.log('tsp-client commands completed.');
  } finally {
    process.chdir(originalCwd);
  }
}

// Get the path to launchSettings.json
function getLaunchSettingsPath() {
  return resolve(__dirname, '../generator/Microsoft.TypeSpec.Generator/src/Properties/launchSettings.json');
}

// Read and parse launchSettings.json
async function readLaunchSettings() {
  const launchSettingsPath = getLaunchSettingsPath();
  const content = await fs.readFile(launchSettingsPath, 'utf8');
  return JSON.parse(content);
}

// Write launchSettings.json
async function writeLaunchSettings(launchSettings) {
  const launchSettingsPath = getLaunchSettingsPath();
  const content = JSON.stringify(launchSettings, null, 2);
  await fs.writeFile(launchSettingsPath, content);
}

// Generate a profile name from the SDK directory
function generateProfileName(sdkDirectory) {
  const dirName = basename(resolve(sdkDirectory));
  // Replace invalid characters and make it a valid profile name
  return dirName.replace(/[^a-zA-Z0-9-_.]/g, '-');
}

// Add or update a debug profile in launchSettings.json
async function addDebugProfile(sdkDirectory, generatorName = 'ScmCodeModelGenerator') {
  const launchSettings = await readLaunchSettings();
  const profileName = generateProfileName(sdkDirectory);
  
  // Create the new profile
  const newProfile = {
    commandLineArgs: `$(SolutionDir)/../dist/generator/Microsoft.TypeSpec.Generator.dll "${resolve(sdkDirectory)}" -g ${generatorName}`,
    commandName: "Executable",
    executablePath: "dotnet"
  };
  
  // Add or update the profile
  launchSettings.profiles[profileName] = newProfile;
  
  await writeLaunchSettings(launchSettings);
  
  console.log(`Added debug profile '${profileName}' to launchSettings.json`);
  console.log(`Profile configuration:`);
  console.log(`  - Executable: dotnet`);
  console.log(`  - Arguments: $(SolutionDir)/../dist/generator/Microsoft.TypeSpec.Generator.dll "${resolve(sdkDirectory)}" -g ${generatorName}`);
  
  return profileName;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node add-debug-profile.js <SDK_DIRECTORY> [options]

Arguments:
  SDK_DIRECTORY         Path to the target SDK service directory

Options:
  -g, --generator      Generator name (default: ScmCodeModelGenerator)
  -h, --help          Show this help message

Examples:
  node add-debug-profile.js /path/to/azure-sdk-for-net/sdk/storage/Azure.Storage.Blobs
  node add-debug-profile.js ./local-sdk-dir -g StubLibraryGenerator
`);
    process.exit(0);
  }
  
  const sdkDirectory = args[0];
  let generatorName = 'ScmCodeModelGenerator';
  
  // Parse additional arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '-g' || args[i] === '--generator') {
      if (i + 1 < args.length) {
        generatorName = args[i + 1];
        i++; // Skip the next argument as it's the value
      }
    }
  }
  
  try {
    // Check if SDK directory exists
    const sdkPath = resolve(sdkDirectory);
    try {
      await fs.access(sdkPath);
    } catch {
      throw new Error(`SDK directory does not exist: ${sdkPath}`);
    }
    
    // Check if npm is available
    if (!commandExists('npm')) {
      throw new Error('npm is not installed or not in PATH');
    }
    
    // Install tsp-client if not installed
    if (!isTspClientInstalled()) {
      console.log('tsp-client is not installed. Installing now...');
      try {
        installTspClient();
      } catch (error) {
        console.warn('Warning: Failed to install tsp-client. You may need to install it manually with:');
        console.warn('npm install -g @azure-tools/typespec-client-generator-cli');
        console.warn('Error:', error.message);
      }
    } else {
      console.log('tsp-client is already installed.');
    }
    
    // Run tsp-client commands
    await runTspClientCommands(sdkPath);
    
    // Add debug profile
    const profileName = await addDebugProfile(sdkPath, generatorName);
    
    console.log(`\nSetup completed successfully!`);
    console.log(`You can now debug the '${profileName}' profile in Visual Studio or VS Code.`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});