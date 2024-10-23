import type { JSONSchemaType } from "ajv";
import { TypeSpecConfigJsonSchema } from "../config/config-schema.js";
import { TypeSpecRawConfig } from "../config/types.js";

export interface InitTemplateFile {
  path: string;
  destination: string;
  skipGeneration?: boolean;
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
  compilerVersion?: string;

  /**
   * List of libraries to include
   */
  libraries?: InitTemplateLibrary[];

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

/**
 * Describes a library dependency that will be added to the generated project.
 */
export type InitTemplateLibrary = string | InitTemplateLibrarySpec;

/**
 * Describes a library dependency that will be added to the generated project.
 */
export interface InitTemplateLibrarySpec {
  /**
   * The npm package name of the library.
   */
  name: string;

  /**
   *  The npm-style version string as it would appear in package.json.
   */
  version?: string;
}

export const InitTemplateLibrarySpecSchema: JSONSchemaType<InitTemplateLibrarySpec> = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    version: { type: "string", nullable: true },
  },
  required: ["name"],
};

export const InitTemplateSchema: JSONSchemaType<InitTemplate> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    compilerVersion: { type: "string", nullable: true },
    libraries: {
      type: "array",
      items: {
        oneOf: [{ type: "string" }, InitTemplateLibrarySpecSchema],
      },
      nullable: true,
    },
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
          skipGeneration: { type: "boolean", nullable: true },
        },
        required: ["path", "destination"],
      },
    },
  },
  required: ["title", "description"],
};
