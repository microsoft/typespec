import {
  getLibraryName,
  getSdkModel,
  SdkContext,
  SdkModelPropertyTypeBase,
  SdkPathParameter,
} from "@azure-tools/typespec-client-generator-core";
import { Enum, EnumMember, Model, ModelProperty, Operation, Scalar } from "@typespec/compiler";
import { spawn, SpawnOptions } from "child_process";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputPrimitiveType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { Logger } from "./logger.js";

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getNameForTemplate(model: Model): string {
  if (model.name !== "" && model.templateMapper && model.templateMapper.args) {
    return model.name + model.templateMapper.args.map((it) => (it as Model).name).join("");
  }

  return model.name;
}

export function getTypeName(
  context: SdkContext,
  type: Model | Enum | EnumMember | ModelProperty | Scalar | Operation,
): string {
  const name = getLibraryName(context, type);
  if (type.kind !== "Model") return name;
  if (type.name === name) {
    const templateName = getNameForTemplate(type);
    if (templateName === "") {
      const sdkModel = getSdkModel(context, type as Model);
      return sdkModel.name;
    }
    return templateName;
  }
  return name;
}

export function createContentTypeOrAcceptParameter(
  mediaTypes: string[],
  name: string,
  nameInRequest: string,
): InputParameter {
  const isContentType: boolean = nameInRequest.toLowerCase() === "content-type";
  const inputType: InputPrimitiveType = {
    kind: "string",
    name: "string",
    crossLanguageDefinitionId: "TypeSpec.string",
  };
  return {
    Name: name,
    NameInRequest: nameInRequest,
    Type: inputType,
    Location: RequestLocation.Header,
    IsApiVersion: false,
    IsResourceParameter: false,
    IsContentType: isContentType,
    IsRequired: true,
    IsEndpoint: false,
    SkipUrlEncoding: false,
    Explode: false,
    Kind: InputOperationParameterKind.Constant,
    DefaultValue:
      mediaTypes.length === 1
        ? ({
            Type: inputType,
            Value: mediaTypes[0],
          } as InputConstant)
        : undefined,
  };
}

export function isSdkPathParameter(
  parameter: SdkModelPropertyTypeBase,
): parameter is SdkPathParameter {
  return (parameter as SdkPathParameter).kind === "path";
}

export async function execCSharpGenerator(options: {
  generatorPath: string;
  outputFolder: string;
  pluginName: string;
  newProject: boolean;
  debug: boolean;
}): Promise<{ exitCode: number; stdio: string; stdout: string; stderr: string; proc: any }> {
  const command = "dotnet";
  const args = [
    "--roll-forward",
    "Major",
    options.generatorPath,
    options.outputFolder,
    "-p",
    options.pluginName,
  ];
  if (options.newProject) {
    args.push("--new-project");
  }
  if (options.debug) {
    args.push("--debug");
  }
  Logger.getInstance().info(`${command} ${args.join(" ")}`);

  const child = spawn(command, args, { stdio: "pipe" });

  return new Promise((resolve, reject) => {
    let buffer = "";

    child.stdout?.on("data", (data) => {
      buffer += data.toString();
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        const message = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        Logger.getInstance().info(`Received from C#: ${message}`);
        processJsonRpc(message);
        // Process the JSON-RPC response
        // const response = JSON.parse(message);
        // if (response.result) {
        //     console.log('Result:', response.result);
        // } else if (response.error) {
        //     console.error('Error:', response.error);
        // }
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdio: "",
        stdout: "",
        stderr: "",
        proc: child,
      });
    });
  });
}

function processJsonRpc(message: string) {
  const response = JSON.parse(message);
  const method = response.method;
  const params = response.params;
  switch (method) {
    case "info":
      Logger.getInstance().info(params.message);
      break;
    case "diagnostic":
      Logger.getInstance().info(params.message);
      break;
  }
}

export async function execAsync(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; stdio: string; stdout: string; stderr: string; proc: any }> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdio: Buffer[] = [];
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (data) => {
      stdout.push(data);
      stdio.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
      stdio.push(data);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdio: Buffer.concat(stdio).toString(),
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}
