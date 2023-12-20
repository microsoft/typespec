import Mustache from "mustache";
import { InitTemplate } from "./init-template.js";
import { ScaffoldingConfig } from "./scaffold.js";

export type FileTemplatingContext = Omit<InitTemplate, "libraries"> &
  ScaffoldingConfig & {
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

export function createFileTemplatingContext(config: ScaffoldingConfig): FileTemplatingContext {
  return {
    ...config.template,
    ...config,
    normalizeVersion,
    toLowerCase,
    normalizePackageName,
  };
}

export function render(content: string, context: FileTemplatingContext): string {
  return Mustache.render(content, context);
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
