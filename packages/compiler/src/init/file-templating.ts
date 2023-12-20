import { camelCase, kebabCase, pascalCase } from "change-case";
import Mustache from "mustache";
import { InitTemplate } from "./init-template.js";
import { ScaffoldingConfig } from "./scaffold.js";

export type FileTemplatingContext = Omit<InitTemplate, "libraries"> &
  ScaffoldingConfig & {
    naming: NamingUtils;
    /**
     * NormalizeVersion function replaces `-` with `_`.
     */
    normalizeVersion: () => (text: string, render: any) => string;

    /**
     * toLowerCase function for template replacement
     */
    toLowerCase: () => (text: string, render: any) => string;

    /**
     * Normalize package name for langauges other than C#. It replaces `.` with `-` and toLowerCase
     */
    normalizePackageName: () => (text: string, render: any) => string;
  };

export interface NamingUtils {
  readonly camelCase: () => (text: string, render: (...args: any) => string) => string;
  readonly pascalCase: () => (text: string, render: (...args: any) => string) => string;
  readonly kebabCase: () => (text: string, render: (...args: any) => string) => string;
}

export function createFileTemplatingContext(config: ScaffoldingConfig): FileTemplatingContext {
  return {
    ...config.template,
    ...config,
    normalizeVersion,
    toLowerCase,
    normalizePackageName,
    naming,
  };
}

export function render(content: string, context: FileTemplatingContext): string {
  return Mustache.render(content, context);
}

const naming: NamingUtils = {
  camelCase: createNamingUtils(camelCase),
  kebabCase: createNamingUtils(kebabCase),
  pascalCase: createNamingUtils(pascalCase),
};

function createNamingUtils(fn: (text: string) => string) {
  return () => (text: string, render: (...args: any) => string) => fn(render(text));
}

const normalizeVersion = function () {
  return function (text: string, render: any): string {
    return render(text).replaceAll("-", "_");
  };
};

const toLowerCase = function () {
  return function (text: string, render: any): string {
    return render(text).toLowerCase();
  };
};

const normalizePackageName = function () {
  return function (text: string, render: any): string {
    return render(text).replaceAll(".", "-").toLowerCase();
  };
};
