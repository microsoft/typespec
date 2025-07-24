#!/usr/bin/env node

/**
 * Simple test for the add-debug-profile script
 */

import { promises as fs } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('Testing add-debug-profile script...');
  
  // Backup original launchSettings.json
  const launchSettingsPath = resolve(__dirname, '../generator/Microsoft.TypeSpec.Generator/src/Properties/launchSettings.json');
  const backupPath = launchSettingsPath + '.backup';
  
  try {
    await fs.copyFile(launchSettingsPath, backupPath);
    console.log('✓ Backed up original launchSettings.json');
    
    // Create test directory
    const testDir = '/tmp/test-script-profile';
    await fs.mkdir(testDir, { recursive: true });
    console.log('✓ Created test directory');
    
    // Run the script
    const scriptPath = resolve(__dirname, 'add-debug-profile.js');
    execSync(`node "${scriptPath}" "${testDir}" -g TestGenerator`, { 
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    // Verify the profile was added
    const launchSettings = JSON.parse(await fs.readFile(launchSettingsPath, 'utf8'));
    const profileName = 'test-script-profile';
    
    if (!launchSettings.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' was not added to launchSettings.json`);
    }
    
    const profile = launchSettings.profiles[profileName];
    if (profile.executablePath !== 'dotnet') {
      throw new Error(`Expected executablePath to be 'dotnet', got '${profile.executablePath}'`);
    }
    
    if (!profile.commandLineArgs.includes('TestGenerator')) {
      throw new Error(`Expected commandLineArgs to include 'TestGenerator', got '${profile.commandLineArgs}'`);
    }
    
    if (!profile.commandLineArgs.includes(testDir)) {
      throw new Error(`Expected commandLineArgs to include test directory path, got '${profile.commandLineArgs}'`);
    }
    
    console.log('✓ Profile was added correctly with expected properties');
    console.log('✓ All tests passed!');
    
  } finally {
    // Restore original launchSettings.json
    try {
      await fs.copyFile(backupPath, launchSettingsPath);
      await fs.unlink(backupPath);
      console.log('✓ Restored original launchSettings.json');
    } catch (error) {
      console.error('Warning: Failed to restore original launchSettings.json:', error.message);
    }
  }
}

runTest().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});