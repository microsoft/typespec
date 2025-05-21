/* eslint-disable no-console */
import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { DefaultHttpClientFetch } from "./http-client.js";

interface Options {
  /**
   * Path to the http-client-csharp package
   */
  packagePath: string;

  /**
   * Pull request URL of the PR in typespec repository
   */
  pullRequestUrl: string;

  /**
   * Direct URL to the published NuGet package
   */
  packageUrl: string;

  /**
   * GitHub token for authentication
   */
  githubToken: string;

  /**
   * Branch name to create in azure-sdk-for-net
   */
  branchName?: string;
}

/**
 * Creates a PR in the azure-sdk-for-net repository to update the http-client-csharp dependency
 */
export async function createAzureSdkForNetPr(options: Options): Promise<void> {
  const { packagePath, pullRequestUrl, packageUrl, githubToken } = options;
  console.log(`Creating PR for azure-sdk-for-net to update dependency on http-client-csharp`);

  // Create temp folder for repo
  const tempDir = join(process.cwd(), "temp", "azure-sdk-for-net");
  mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory at ${tempDir}`);

  try {
    // Clone the repository
    console.log(`Cloning azure-sdk-for-net repository...`);
    execSync(`git clone https://github.com/Azure/azure-sdk-for-net.git ${tempDir}`, {
      stdio: "inherit",
    });

    // Read package info
    const packageJsonPath = resolve(packagePath, "package.json");
    const packageJsonContent = require(packageJsonPath);
    const packageVersion = packageJsonContent.version;
    console.log(`Using package version: ${packageVersion}`);

    // Generate branch name if not provided
    const branchName = options.branchName || `typespec/update-http-client-${packageVersion}`;
    console.log(`Using branch name: ${branchName}`);

    // Create a new branch
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, {
      stdio: "inherit",
      cwd: tempDir,
    });

    // Update the dependency in Directory.Packages.props (this is the file that usually contains dependency versions in Azure SDK)
    console.log(`Updating dependency version in Directory.Packages.props...`);
    const propsFilePath = join(tempDir, "Directory.Packages.props");
    const propsFileContent = require("fs").readFileSync(propsFilePath, "utf8");

    // Update the appropriate package reference in the file
    // This is a simple replacement and might need to be improved based on the exact structure of the file
    const updatedContent = propsFileContent.replace(
      /<PackageVersion Include="Microsoft\.TypeSpec\.Generator\.ClientModel".*?>(.*?)<\/PackageVersion>/g,
      `<PackageVersion Include="Microsoft.TypeSpec.Generator.ClientModel">$packageVersion</PackageVersion>`
    );
    
    // Write the updated file back
    writeFileSync(propsFilePath, updatedContent);
    
    // Commit the changes
    console.log(`Committing changes...`);
    execSync(`git add Directory.Packages.props`, {
      stdio: "inherit",
      cwd: tempDir,
    });
    execSync(`git commit -m "Update Microsoft.TypeSpec.Generator.ClientModel to ${packageVersion}"`, {
      stdio: "inherit",
      cwd: tempDir,
    });

    // Push the branch
    console.log(`Pushing branch to remote...`);
    // Using HTTPS with token for auth
    const remoteUrl = `https://${githubToken}@github.com/Azure/azure-sdk-for-net.git`;
    execSync(`git push ${remoteUrl} ${branchName}`, {
      stdio: "inherit",
      cwd: tempDir,
    });

    // Create PR using GitHub API
    console.log(`Creating PR in Azure/azure-sdk-for-net...`);
    const client = new DefaultHttpClientFetch();

    const prBody = `
This PR updates the dependency on Microsoft.TypeSpec.Generator.ClientModel to version ${packageVersion}.

## Details

- Original TypeSpec PR: ${pullRequestUrl}
- Package URL: ${packageUrl}

This is an automated PR created by the TypeSpec publish pipeline.
    `.trim();

    const prTitle = `Update Microsoft.TypeSpec.Generator.ClientModel to ${packageVersion}`;

    const response = await client.fetch(`https://api.github.com/repos/Azure/azure-sdk-for-net/pulls`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "User-Agent": "Microsoft-TypeSpec",
      },
      body: JSON.stringify({
        title: prTitle,
        body: prBody,
        head: branchName,
        base: "master", // Assuming the main branch is called 'master'
      }),
    });

    if (response.status >= 400) {
      const responseBody = await response.text();
      console.error(`Failed to create PR: ${responseBody}`);
      throw new Error(`Failed to create PR: ${response.status}`);
    }

    const responseJson = await response.json();
    console.log(`Successfully created PR: ${responseJson.html_url}`);
  } catch (error) {
    console.error(`Error creating PR:`, error);
    throw error;
  }
}