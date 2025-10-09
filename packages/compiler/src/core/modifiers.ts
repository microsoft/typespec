// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import { Program } from "./program.js";
import { Declaration, ModifierFlags, SyntaxKind } from "./types.js";

/**
 * The compatibility of modifiers for a given declaration node type.
 */
interface ModifierCompatibility {
  /** A set of modifier flags that are allowed on the node type. */
  readonly allowed: ModifierFlags;
  /** A set of modifier flags that are _required_ on the node type. */
  readonly required: ModifierFlags;
}

/**
 * The default compatibility for all declaration syntax nodes.
 *
 * By default, only the `internal` modifier is allowed on all declaration syntax nodes.
 * No modifiers are required by default.
 */
const DEFAULT_COMPATIBILITY: ModifierCompatibility = {
  allowed: ModifierFlags.Internal,
  required: ModifierFlags.None,
};

const SYNTAX_MODIFIERS: Readonly<Record<Declaration["kind"], ModifierCompatibility>> = {
  [SyntaxKind.NamespaceStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.OperationStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ModelStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ScalarStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.InterfaceStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.UnionStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.EnumStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.AliasStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.FunctionDeclarationStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ConstStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.DecoratorDeclarationStatement]: {
    allowed: ModifierFlags.All,
    required: ModifierFlags.Extern,
  },
};

/**
 * Checks the modifiers on a declaration node against the allowed and required modifiers.
 *
 * This will report diagnostics in the given program if there are any invalid or missing required modifiers.
 *
 * @param program - The current program (used to report diagnostics).
 * @param node - The declaration node to check.
 * @returns `true` if the modifiers are valid, `false` otherwise.
 */
export function checkModifiers(program: Program, node: Declaration): boolean {
  const compatibility = SYNTAX_MODIFIERS[node.kind];

  let isValid = true;

  if (node.modifierFlags & ~compatibility.allowed) {
    // There is at least one modifier used that is not allowed on this syntax node.
    isValid = false;

    // TODO: report diagnostic "Modifier 'X' is not allowed on Y declarations."
  }

  if ((node.modifierFlags & compatibility.required) !== compatibility.required) {
    // There is at least one required modifier missing from this syntax node.
    isValid = false;

    // TODO: report diagnostic "Modifier 'X' is required for Y declarations."
  }

  return isValid;
}
