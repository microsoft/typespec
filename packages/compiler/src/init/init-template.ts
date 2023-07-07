import { JSONSchemaType } from "ajv";
import { TypeSpecConfigJsonSchema } from "../config/config-schema.js";
import { TypeSpecRawConfig } from "../config/types.js";

export interface InitTemplateFile {
  path: string;
  destination: string;
  skipGeneration: boolean;
}

export interface InitTemplateInput {
  description: string;
  type: "text";
  initialValue: any;
}

export interface InitTemplate {
  /**
   * Name of the template
   */
  title: string;

  /**
   * Description for the template.
   */
  description: string;

  /** Minimum Compiler Support Version */
  compilerVersion: string;

  /**
   * List of libraries to include
   */
  libraries: string[];

  /**
   * Config
   */
  config?: TypeSpecRawConfig;

  /**
   * Custom inputs to prompt to the user
   */
  inputs?: Record<string, InitTemplateInput>;

  /**
   * A flag to indicate not adding @typespec/compiler package to package.json.
   * Other libraries may already brought in the dependency such as Azure template.
   */
  skipCompilerPackage?: boolean;

  /**
   * List of files to copy.
   */
  files?: InitTemplateFile[];
}

export const InitTemplateSchema: JSONSchemaType<InitTemplate> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    compilerVersion: { type: "string" },
    libraries: { type: "array", items: { type: "string" } },
    skipCompilerPackage: { type: "boolean", nullable: true },
    config: { nullable: true, ...TypeSpecConfigJsonSchema },
    inputs: {
      type: "object",
      nullable: true,
      additionalProperties: {
        type: "object",
        properties: {
          description: { type: "string" },
          type: { type: "string", enum: ["text"] },
          initialValue: {} as any,
        },
        required: ["description", "type"],
      },
      required: [],
    },
    files: {
      type: "array",
      nullable: true,
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          destination: { type: "string" },
          skipGeneration: { type: "boolean" },
        },
        required: ["path", "destination"],
      },
    },
  },
  required: ["title", "description", "compilerVersion"],
};
