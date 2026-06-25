// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import { compilerAssert } from "./diagnostics.js";
import { createDiagnostic } from "./messages.js";
import { Program } from "./program.js";
import { Declaration, Modifier, ModifierFlags, SyntaxKind } from "./types.js";

/**
 * The compatibility of modifiers for a given declaration node type.
 */
interface ModifierCompatibility {
  /** A set of modifier flags that are allowed on the node type. */
  readonly allowed: ModifierFlags;
  /** At least one of these modifier flags must be present. */
  readonly required: ModifierFlags;
  /** Pairs of modifier flags that cannot be used together. */
  readonly mutuallyExclusive?: readonly [ModifierFlags, ModifierFlags][];
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

const NO_MODIFIERS: ModifierCompatibility = {
  allowed: ModifierFlags.None,
  required: ModifierFlags.None,
};

const SYNTAX_MODIFIERS: Readonly<Record<Declaration["kind"], ModifierCompatibility>> = {
  [SyntaxKind.NamespaceStatement]: NO_MODIFIERS,
  [SyntaxKind.OperationStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ModelStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ScalarStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.InterfaceStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.UnionStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.EnumStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.AliasStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.ConstStatement]: DEFAULT_COMPATIBILITY,
  [SyntaxKind.DecoratorDeclarationStatement]: {
    allowed: ModifierFlags.All,
    required: ModifierFlags.Extern | ModifierFlags.Auto,
    mutuallyExclusive: [[ModifierFlags.Extern, ModifierFlags.Auto]],
  },
  [SyntaxKind.FunctionDeclarationStatement]: {
    allowed: ModifierFlags.Extern | ModifierFlags.Internal,
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

  const invalidModifiers = node.modifierFlags & ~compatibility.allowed;

  if (invalidModifiers) {
    // There is at least one modifier used that is not allowed on this syntax node.
    isValid = false;

    const invalidModifierList = filterModifiersByFlags(node.modifiers, invalidModifiers);

    for (const modifier of invalidModifierList) {
      const modifierText = getTextForModifier(modifier);
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-modifier",
          messageId: "not-allowed",
          format: { modifier: modifierText, nodeKind: getDeclarationKindText(node.kind) },
          target: modifier,
        }),
      );
    }
  }

  if (compatibility.required && !(node.modifierFlags & compatibility.required)) {
    // None of the required modifiers are present.
    isValid = false;

    const names = getNamesOfModifierFlags(compatibility.required);
    if (names.length === 1) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-modifier",
          messageId: "missing-required",
          format: { modifier: names[0], nodeKind: getDeclarationKindText(node.kind) },
          target: node,
        }),
      );
    } else {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-modifier",
          messageId: "missing-required-one-of",
          format: {
            modifiers: names.map((n) => `'${n}'`).join(" or "),
            nodeKind: getDeclarationKindText(node.kind),
          },
          target: node,
        }),
      );
    }
  }

  if (compatibility.mutuallyExclusive) {
    for (const [a, b] of compatibility.mutuallyExclusive) {
      if (node.modifierFlags & a && node.modifierFlags & b) {
        isValid = false;

        const nameA = getNamesOfModifierFlags(a)[0];
        const nameB = getNamesOfModifierFlags(b)[0];
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-modifier",
            messageId: "mutually-exclusive",
            format: { modifierA: nameA, modifierB: nameB },
            target: node,
          }),
        );
      }
    }
  }

  return isValid;
}

function filterModifiersByFlags(modifiers: Modifier[], flags: ModifierFlags): Modifier[] {
  const result = [];

  for (const modifier of modifiers) {
    if (modifierToFlag(modifier) & flags) {
      result.push(modifier);
    }
  }

  return result;
}

export function modifiersToFlags(modifiers: Modifier[]): ModifierFlags {
  let flags = ModifierFlags.None;
  for (const modifier of modifiers) {
    flags |= modifierToFlag(modifier);
  }
  return flags;
}

function modifierToFlag(modifier: Modifier): ModifierFlags {
  switch (modifier.kind) {
    case SyntaxKind.ExternKeyword:
      return ModifierFlags.Extern;
    case SyntaxKind.InternalKeyword:
      return ModifierFlags.Internal;
    case SyntaxKind.AutoKeyword:
      return ModifierFlags.Auto;
    default:
      compilerAssert(false, `Unknown modifier kind: ${(modifier as Modifier).kind}`);
  }
}

function getTextForModifier(modifier: Modifier): string {
  switch (modifier.kind) {
    case SyntaxKind.ExternKeyword:
      return "extern";
    case SyntaxKind.InternalKeyword:
      return "internal";
    case SyntaxKind.AutoKeyword:
      return "auto";
    default:
      compilerAssert(false, `Unknown modifier kind: ${(modifier as Modifier).kind}`);
  }
}

function getNamesOfModifierFlags(flags: ModifierFlags): string[] {
  const names: string[] = [];
  if (flags & ModifierFlags.Extern) {
    names.push("extern");
  }
  if (flags & ModifierFlags.Internal) {
    names.push("internal");
  }
  if (flags & ModifierFlags.Auto) {
    names.push("auto");
  }
  return names;
}

function getDeclarationKindText(nodeKind: Declaration["kind"]): string {
  switch (nodeKind) {
    case SyntaxKind.NamespaceStatement:
      return "namespace";
    case SyntaxKind.OperationStatement:
      return "op";
    case SyntaxKind.ModelStatement:
      return "model";
    case SyntaxKind.ScalarStatement:
      return "scalar";
    case SyntaxKind.InterfaceStatement:
      return "interface";
    case SyntaxKind.UnionStatement:
      return "union";
    case SyntaxKind.EnumStatement:
      return "enum";
    case SyntaxKind.AliasStatement:
      return "alias";
    case SyntaxKind.DecoratorDeclarationStatement:
      return "dec";
    case SyntaxKind.FunctionDeclarationStatement:
      return "function";
    case SyntaxKind.ConstStatement:
      return "const";
    default:
      compilerAssert(false, `Unknown declaration kind: ${nodeKind}`);
  }
}
