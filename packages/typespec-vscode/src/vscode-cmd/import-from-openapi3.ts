import { PackageJson } from "@typespec/compiler";
import { major, minor } from "semver";
import { inspect } from "util";
import vscode from "vscode";
import logger from "../log/logger.js";
import { normalizePath } from "../path-utils.js";
import telemetryClient from "../telemetry/telemetry-client.js";
import { TelemetryEventName } from "../telemetry/telemetry-event.js";
import { Result, ResultCode } from "../types.js";
import {
  checkAndConfirmEmptyFolder,
  selectFile,
  selectFolder,
  tryExecuteWithUi,
} from "../ui-utils.js";
import {
  ExecOutput,
  isDirectory,
  isExecOutputCmdNotFound,
  loadDependencyPackageJson,
  searchAndLoadPackageJson,
  spawnExecutionAndLogToOutput,
} from "../utils.js";

const TITLE = "Import TypeSpec From OpenAPI3";
const TSP_OPENAPI3_COMMAND = "tsp-openapi3";
const TSP_COMPILER_PACKAGE = "@typespec/compiler";
const TSP_OPENAPI3_PACKAGE = "@typespec/openapi3";
const TSP_OPENAPI3_PACKAGE_DETAILS =
  "TypeSpec library for emitting OpenAPI 3.0 from the TypeSpec REST protocol binding and converting OpenAPI3 to TypeSpec";
const TSP_OPENAPI3_PACKAGE_LINK = "https://typespec.io/docs/emitters/openapi3/cli/";

export async function importFromOpenApi3(uri: vscode.Uri | undefined) {
  await telemetryClient.doOperationWithTelemetry<ResultCode>(
    TelemetryEventName.ImportFromOpenApi3,
    async (tel) => {
      return vscode.window.withProgress<ResultCode>(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: "Importing from OpenAPI...",
        },
        async () => {
          const targetFolder =
            uri && uri.fsPath && (await isDirectory(uri.fsPath))
              ? normalizePath(uri.fsPath)
              : await selectFolder(
                  "Select target folder to import OpenAPI",
                  "Select Target Folder",
                );
          if (!targetFolder) {
            logger.info("Importing from OpenApi canceled because no target folder selected");
            tel.lastStep = "No target folder selected";
            return ResultCode.Cancelled;
          }
          const checkEmpty = await checkAndConfirmEmptyFolder(
            targetFolder,
            "The selected folder isn't empty. Do you want to continue? Some existing files may be overwritten.",
            TITLE,
          );
          if (!checkEmpty) {
            logger.info("Importing from OpenApi canceled due to non-empty target folder.");
            tel.lastStep = "Confirm non-empty target folder";
            return ResultCode.Cancelled;
          }
          const sourceFile = await selectFile(
            "Select OpenAPI file to import",
            "Select OpenAPI File",
            {
              "OpenAPI files": ["json", "yaml", "yml"],
            },
          );
          if (!sourceFile) {
            logger.info("Importing from OpenApi canceled because no source file selected.");
            tel.lastStep = "No source file selected";
            return ResultCode.Cancelled;
          }
          const result = await checkAndImport(sourceFile, targetFolder);
          if (result.code === ResultCode.Success) {
            logger.info("Importing from OpenAPI succeeded.", [], {
              showPopup: true,
              showOutput: false,
            });
          } else if (result.code === ResultCode.Cancelled) {
            logger.info("Importing from OpenAPI canceled by user.", []);
          } else {
            logger.error(
              "Importing from OpenAPI failed. Please check previous logs for details.",
              [],
              {
                showPopup: true,
                showOutput: true,
              },
            );
          }
          return result.code;
        },
      );

      async function checkAndImport(
        sourceFile: string,
        targetFolder: string,
      ): Promise<Result<ExecOutput>> {
        const { packageJsonFolder, packageJson } = await searchAndLoadPackageJson(targetFolder);
        if (!packageJsonFolder || !packageJson) {
          logger.info(
            "Cannot find package.json in target folder and its parents, try to import by using global openapi3",
          );
          return await importUsingGlobalOpenApi3(sourceFile, targetFolder);
        } else {
          const result = await tryInstallOpenApi3Locally(packageJson, packageJsonFolder);
          if (result.code === ResultCode.Success) {
            tel.lastStep = "Install openapi3 locally and import";
            return tryImport(sourceFile, targetFolder, false /*globalScope*/);
          } else {
            tel.lastStep = "Install OpenAPI3 locally";
            return result;
          }
        }
      }

      async function tryInstallOpenApi3Locally(
        packageJson: PackageJson,
        packageJsonFolder: string,
      ): Promise<Result<ExecOutput | undefined>> {
        if (
          (packageJson.dependencies && packageJson.dependencies[TSP_OPENAPI3_PACKAGE]) ||
          (packageJson.devDependencies && packageJson.devDependencies[TSP_OPENAPI3_PACKAGE])
        ) {
          const openApi3Package = await loadDependencyPackageJson(
            packageJsonFolder,
            TSP_OPENAPI3_PACKAGE,
          );
          if (openApi3Package) {
            // found openapi3 package in package.json which has been installed
            logger.info(`Found ${TSP_OPENAPI3_PACKAGE} in package.json which has been installed`);
            return { code: ResultCode.Success, value: undefined };
          } else {
            // found openapi3 package in package.json but it has not been installed
            logger.info(
              `Found ${TSP_OPENAPI3_PACKAGE} in package.json but not installed, try to confirm to install it by 'npm install'`,
            );
            return await tryExecuteWithUi(
              {
                name: `Confirm and try to install OpenAPI3 package by 'npm install'`,
                confirm: {
                  title: TITLE,
                  placeholder: `'${TSP_OPENAPI3_PACKAGE}' is required to import OpenApi3. Do you want to install it?`,
                  yesQuickPickItem: {
                    label: `Install ${TSP_OPENAPI3_PACKAGE}`,
                    description: `by 'npm install'`,
                    detail: TSP_OPENAPI3_PACKAGE_DETAILS,
                    externalLink: TSP_OPENAPI3_PACKAGE_LINK,
                  },
                  noQuickPickItem: {
                    label: "Cancel",
                  },
                },
                progress: {
                  timeoutInMs: 5 * 60 * 1000, // 5 minutes as timeout
                  title: `Installing ${TSP_OPENAPI3_PACKAGE}...`,
                  withCancelAndTimeout: true,
                },
              },
              async () => {
                try {
                  return await spawnExecutionAndLogToOutput("npm", ["install"], packageJsonFolder);
                } catch (error: any) {
                  // if we found the error is because confliction from @typespec/compiler, try to output more log to help user troubleshooting
                  if (
                    error?.stderr &&
                    error.stderr.includes("ERESOLVE") &&
                    error.stderr.includes(TSP_COMPILER_PACKAGE)
                  ) {
                    logger.error(
                      `'npm install' failed because of version confliction of ${TSP_COMPILER_PACKAGE} \n` +
                        `  - Please make sure your typespec's packages are compatible with ${TSP_COMPILER_PACKAGE}. \n` +
                        `  - Or you can try to upgrade the ${TSP_COMPILER_PACKAGE} and other typespec's packages to the latest version and try again.`,
                    );
                  }
                  throw error;
                }
              },
            );
          }
        } else {
          // cannot find openapi3 package in package.json
          logger.info(
            `Cannot find ${TSP_OPENAPI3_PACKAGE} in package.json, try to confirm to install it by 'npm install ${TSP_OPENAPI3_PACKAGE}'`,
          );
          return tryExecuteWithUi(
            {
              name: `Confirm and try to install OpenAPI3 package by 'npm install ${TSP_OPENAPI3_PACKAGE}'`,
              confirm: {
                title: TITLE,
                placeholder: `'${TSP_OPENAPI3_PACKAGE}' is required to import OpenApi3. Do you want to install it?`,
                yesQuickPickItem: {
                  label: `Install ${TSP_OPENAPI3_PACKAGE}`,
                  description: `by 'npm install ${TSP_OPENAPI3_PACKAGE}'`,
                  detail: TSP_OPENAPI3_PACKAGE_DETAILS,
                  externalLink: TSP_OPENAPI3_PACKAGE_LINK,
                },
                noQuickPickItem: {
                  label: "Cancel",
                },
              },
              progress: {
                timeoutInMs: 5 * 60 * 1000, // 5 minutes as timeout
                title: ``,
                withCancelAndTimeout: true,
              },
            },
            async (progress) => {
              // because we have a strict version dependency between compiler and openapi3, we need to check the
              // compiler version to determine the openapi3 version to install.
              // TODO: remove this part when we loose the version dependency between compiler and openapi3.
              progress?.report({ message: "Checking compiler version..." });
              logger.info("Checking compiler version...");
              const compilerJson = await loadDependencyPackageJson(
                packageJsonFolder,
                TSP_COMPILER_PACKAGE,
              );
              let version = "latest";
              if (compilerJson && compilerJson.version) {
                // we can't use version directly because openapi3 may not have some patch versions.
                const maj = major(compilerJson.version);
                const min = minor(compilerJson.version);
                version = `${maj}.${min}`;
              }
              logger.info(
                `Compiler version: ${compilerJson?.version ?? "N/A"} found, will try to install ${TSP_OPENAPI3_PACKAGE} with version: ${version}`,
              );
              progress?.report({ message: `npm install ${TSP_OPENAPI3_PACKAGE}...` });
              try {
                return await installOpenApi3Package(packageJsonFolder, false, version);
              } catch (error: any) {
                // there is still a small chance installing openapi3 package failed because of the version mismatch. For example,
                // user defined another package which requires an old compiler version but haven't actually installed it yet,
                // then compiler package is not available for us to check the version, but it would still cause confliction when installing openapi3.
                // Here we won't do more check for that case which would take more time/cost and bring worse user experience for other users considering this should be a cornor case,
                // instead, we will show more detail log to guide user to handle that case
                // TODO: consider to handle that if we find it's not a cornor case.
                if (
                  error?.stderr &&
                  error.stderr.includes("ERESOLVE") &&
                  error.stderr.includes(TSP_COMPILER_PACKAGE)
                ) {
                  logger.error(
                    `Error occurs when resolving ${TSP_OPENAPI3_PACKAGE} to install. \n` +
                      `  - Please make sure your npm packages have been installed properly by 'npm install' or the package manager you are using and try again. \n` +
                      `  - If the error persists, please try to upgrade the ${TSP_COMPILER_PACKAGE} to the latest version and try again.`,
                  );
                }
                throw error;
              }
            },
          );
        }
      }

      /**
       *
       * @param sourceFile
       * @param targetFolder
       * @param isGlobal if true, to use the openapi3 installed globally, otherwise, to use the openapi3 installed locally.
       * @returns
       */
      async function tryImport(
        sourceFile: string,
        targetFolder: string,
        isGlobal: boolean,
      ): Promise<Result<ExecOutput>> {
        const result = await tryExecuteWithUi(
          {
            name: "Importing OpenAPI to TypeSpec",
            progress: {
              timeoutInMs: 5 * 60 * 1000, // 5 minutes as timeout
              title: "Importing OpenAPI to TypeSpec...",
              withCancelAndTimeout: true,
            },
          },
          async () => {
            if (isGlobal) {
              return await spawnExecutionAndLogToOutput(
                TSP_OPENAPI3_COMMAND,
                [sourceFile, "--output-dir", `${targetFolder}`],
                targetFolder,
              );
            } else {
              return await spawnExecutionAndLogToOutput(
                "npx",
                [TSP_OPENAPI3_COMMAND, sourceFile, "--output-dir", `${targetFolder}`],
                targetFolder,
              );
            }
          },
        );
        if (result.code === ResultCode.Fail) {
          telemetryClient.logOperationDetailTelemetry(tel.activityId, {
            error: `Error when importing OpenAPI to TypeSpec: ${inspect(result.details)}`,
          });
        }
        return result;
      }

      async function importUsingGlobalOpenApi3(
        sourceFile: string,
        targetFolder: string,
      ): Promise<Result<ExecOutput>> {
        tel.lastStep = "Import using global openapi3";
        const firstTry = await tryImport(sourceFile, targetFolder, true /* isGlobal */);
        if (firstTry.code === ResultCode.Fail && isExecOutputCmdNotFound(firstTry.details)) {
          logger.info(
            `${TSP_OPENAPI3_COMMAND} failed because the command is not found. Try to prompt user to install it and import again.`,
          );
          const installResult = await tryExecuteWithUi(
            {
              name: `Install ${TSP_OPENAPI3_PACKAGE} globally`,
              confirm: {
                title: TITLE,
                placeholder: `'${TSP_OPENAPI3_PACKAGE}'is required to import OpenAPI. Do you want to install it?`,
                yesQuickPickItem: {
                  label: `Install ${TSP_OPENAPI3_PACKAGE} globally`,
                  description: `by 'npm install -g ${TSP_OPENAPI3_PACKAGE}'`,
                  detail: TSP_OPENAPI3_PACKAGE_DETAILS,
                  externalLink: TSP_OPENAPI3_PACKAGE_LINK,
                },
                noQuickPickItem: {
                  label: "Cancel",
                },
              },
              progress: {
                timeoutInMs: 300000,
                title: `Installing ${TSP_OPENAPI3_PACKAGE} globally...`,
                withCancelAndTimeout: true,
              },
            },
            async () => {
              return await installOpenApi3Package(targetFolder, true /*isGlobal*/);
            },
          );
          if (installResult.code === ResultCode.Success) {
            tel.lastStep = "Install openapi3 globally and import again";
            return await tryImport(sourceFile, targetFolder, true /* isGlobal */);
          } else {
            tel.lastStep = "Install openapi3 globally";
            return installResult;
          }
        } else {
          return firstTry;
        }
      }

      async function installOpenApi3Package(
        folder: string,
        isGlobal: boolean,
        version?: string,
      ): Promise<ExecOutput> {
        const pkgName = `${TSP_OPENAPI3_PACKAGE}@${version ?? "latest"}`;
        const args = isGlobal ? ["install", "-g", pkgName] : ["install", "--save-dev", pkgName];
        return await spawnExecutionAndLogToOutput("npm", args, folder);
      }
    },
  );
}
