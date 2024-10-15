import { Binder, OutputSymbol, Refkey, useScope } from "@alloy-js/core";
import { PythonOutputScope } from "./index.js";

/**
 * Represents an 'exported' symbol from a .py file. Class, enum, etc.
 */
export interface PythonOutputSymbol extends OutputSymbol {
  scope: PythonOutputScope;
  export: boolean;
}

interface CreatePythonSymbolOptions {
  name: string;
  refkey: Refkey;
  binder?: Binder;
  scope?: PythonOutputScope;
  /** Is this symbol importable? */
  export?: boolean;
}

export function createPythonSymbol(options: CreatePythonSymbolOptions): PythonOutputSymbol {
  const scope = options.scope ?? (useScope() as PythonOutputScope);

  const binder = scope.binder;

  const sym = binder.createSymbol<PythonOutputSymbol>({
    name: options.name,
    scope,
    refkey: options.refkey,
    export: !!options.export,
  });

  return sym;
}
