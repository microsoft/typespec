import { camelCase, kebabCase, pascalCase } from "change-case";
import Mustache from "mustache";
import type { InitTemplate } from "./init-template.js";
import type { ScaffoldingConfig } from "./scaffold.js";

export type FileTemplatingContext = Omit<InitTemplate, "libraries"> &
  ScaffoldingConfig & {
    casing: CasingUtils;
    /**
     * NormalizeVersion function replaces `-` with `_`.
     */
    normalizeVersion: () => (text: string, render: any) => string;

    /**
     * toLowerCase function for template replacement
     */
    toLowerCase: () => (text: string, render: any) => string;

    /**
     * Normalize package name for languages other than C#. It replaces `.` with `-` and toLowerCase
     */
    normalizePackageName: () => (text: string, render: any) => string;
  };

export interface CasingUtils {
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
    casing,
  };
}

export function render(content: string, context: FileTemplatingContext): string {
  return Mustache.render(content, context);
}

const casing: CasingUtils = {
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
