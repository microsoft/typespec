/**
 * Resolve some of the VSCode variables.
 * Simpler aLternative until https://github.com/microsoft/vscode/issues/46471 is supported.
 */
export class VSCodeVariableResolver {
  static readonly VARIABLE_REGEXP = /\$\{([^{}]+?)\}/g;

  public constructor(private variables: Record<string, string>) {}

  public resolve(value: string): string {
    const replaced = value.replace(
      VSCodeVariableResolver.VARIABLE_REGEXP,
      (match: string, variable: string) => {
        return this.variables[variable] ?? match;
      },
    );

    return replaced;
  }
}
