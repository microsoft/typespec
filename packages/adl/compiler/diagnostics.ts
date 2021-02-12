import { Message, Node, SourceLocation, SyntaxKind, SourceFile, Type } from "./types.js";

/** 
 * Represents an error in the code input that is fatal and bails the compilation.
 * 
 * This isn't meant to be kept long term, but we currently do this on all errors.
 */ 
export class DiagnosticError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type ErrorHandler = (message: Message | string, location: SourceLocation, ...args: Array<string | number>) => void;

export const throwOnError: ErrorHandler = throwDiagnostic;

export function throwDiagnostic(message: Message | string, location: SourceLocation, ...args: Array<string | number>): never {
  throw new DiagnosticError(formatDiagnostic(message, location, ...args));
}

export function formatDiagnostic(message: Message | string, location: SourceLocation, ...args: Array<string | number>) { 
  if (typeof message === 'string') {
    // Temporarily allow ad-hoc strings as error messages.
    message = { code: -1, text: message, category: 'error' }
  }

  const code = message.code < 0 ? "" : ` ADL${message.code}`;
  const pos = location.file.getLineAndCharacterOfPosition(location.pos);
  const msg = format(message.text, ...args);
  return `${location.file.path}:${pos.line + 1}:${pos.character + 1} - ${message.category}${code}: ${msg}`;
}

export function getSourceFileOfNode(node: Node): SourceFile {
  while (node.parent !== undefined) {
    node = node.parent;
  }
  if (node.kind !== SyntaxKind.ADLScript) {
    throw new Error("Cannot obtain source file of unbound node.");
  }
  return node.file;
}

export function getSourceLocationOfNode(node: Node): SourceLocation {
  return {
    file: getSourceFileOfNode(node),
    pos: node.pos,
    end: node.end,
  }
}

export function getSourceLocationOfType(type: Type): SourceLocation {
  return getSourceLocationOfNode(type.node);
}

function format(text: string, ...args: Array<string | number>): string {
  return text.replace(/{(\d+)}/g, (_match, index: string) => '' + args[+index] || '<ARGMISSING>');
}