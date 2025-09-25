import {
  CodeFix,
  CodeFixContext,
  createRule,
  createSourceFile,
  DecoratorApplication,
  DiagnosticMessages,
  DiagnosticTarget,
  getSourceLocation,
  getTypeName,
  InsertTextCodeFixEdit,
  LinterRuleContext,
  LinterRuleDefinition,
  ModelProperty,
  Namespace,
  normalizePath,
  Program,
  SemanticNodeListener,
  Type,
} from "@typespec/compiler";
import {
  IdentifierNode,
  MemberExpressionNode,
  SyntaxKind,
  TypeSpecScriptNode,
  UsingStatementNode,
} from "@typespec/compiler/ast";
import { join } from "path";
import { AnyZodObject } from "zod";
import { LmRuleChecker } from "../lm/lm-rule-checker.js";
import { RenameCheckResult } from "./types.js";

export function isMyCode<T extends DiagnosticMessages>(
  target: DiagnosticTarget,
  context: LinterRuleContext<T>,
): boolean {
  const srcFile = getSourceLocation(target);
  const tspFileContext = context.program.getSourceFileLocationContext(srcFile.file);
  return tspFileContext.type === "project";
}

export function isDirectPropertyOfModel(property: ModelProperty): boolean {
  return property.model?.properties.has(property.name) ?? false;
}

export function isUnnamedModelProperty(property: ModelProperty): boolean {
  return property.model?.name === undefined || property.model.name === "";
}

export function getDecratorStringArgValue(
  dec: DecoratorApplication,
  argIndex: number,
): string | undefined {
  if (dec.args.length <= argIndex) {
    return undefined;
  }
  const arg = dec.args[argIndex].value;
  if (arg.entityKind === "Value" && arg.valueKind === "StringValue") {
    return arg.value;
  } else {
    return undefined;
  }
}

export function getFullNamespace(ns: Namespace | undefined): string {
  if (!ns || !ns.name) {
    return "";
  } else {
    const prefix = getFullNamespace(ns.namespace);
    return prefix ? `${prefix}.${ns.name}` : ns.name;
  }
}

export function getFullUsing(using: UsingStatementNode): string {
  const getFullUsingName = (member: MemberExpressionNode | IdentifierNode): string => {
    if (member.kind === SyntaxKind.Identifier) {
      return member.sv;
    } else {
      if (member.base === undefined) {
        return member.id.sv;
      } else {
        return `${getFullUsingName(member.base)}.${member.id.sv}`;
      }
    }
  };
  return getFullUsingName(using.name);
}

export function hasUsing(scriptNode: TypeSpecScriptNode, usingName: string) {
  if (scriptNode !== undefined) {
    for (const u of scriptNode.usings) {
      const fullUsingName = getFullUsing(u);
      if (fullUsingName === usingName) {
        return true;
      }
    }
  }
}

/** The first found one will be returned */
export function getClientNameFromDec(
  target: Type,
  language: string,
): [string | undefined, DecoratorApplication | undefined] {
  const decs = getDecorators(target, "Azure.ClientGenerator.Core", "@clientName");
  for (const dec of decs) {
    const lang = getDecratorStringArgValue(dec, 1);
    const name = getDecratorStringArgValue(dec, 0);
    if (lang === language) {
      return [name, dec];
    }
  }
  return [undefined, undefined];
}

export function getDecorators<T extends Type>(target: T, decNamespace: string, decName: string) {
  const foundDecs: DecoratorApplication[] = [];
  if ("decorators" in target && target.decorators) {
    for (const dec of target.decorators) {
      if (!dec.definition) {
        continue;
      }
      const curDecName = dec.definition.name;
      const curDecNamespace = getFullNamespace(dec.definition.namespace);
      if (curDecName === decName && curDecNamespace === decNamespace) {
        foundDecs.push(dec);
      }
    }
  }
  return foundDecs;
}

// export function getDoc<T extends Type>(target: T): string[] {
//   const docArray: string[] = [];
//   for (const doc of target.node?.docs ?? []) {
//     docArray.push(...doc.content.map((c) => c.text));
//   }

//   const docDecs = getDecorators(target, "TypeSpec", "@doc");
//   for (const dec of docDecs) {
//     const docValue = getDecratorStringArgValue(dec, 0);
//     if (docValue) {
//       docArray.push(docValue);
//     }
//   }
//   return docArray;
// }

export function findClientTsp(program: Program): TypeSpecScriptNode | undefined {
  const root = program.projectRoot;
  const clientTspPath = normalizePath(join(root, "client.tsp"));
  for (const [k, v] of program.sourceFiles) {
    if (normalizePath(k) === clientTspPath) {
      return v;
    }
  }
  return undefined;
}

export function createRenameCodeFix<T extends DiagnosticMessages>(
  aiResult: RenameCheckResult,
  existingClientNameDec: DecoratorApplication | undefined,
  context: LinterRuleContext<T>,
  target: Type,
): CodeFix[] {
  const targetNode = target.node;
  if (targetNode === undefined) {
    // this is not expected
    return [];
  }
  const fixes = aiResult.suggestedNames.map((newName) => {
    return {
      id: `rename-from-lm-suggestion-${getTypeName(target)}-${newName}`,
      label: `Rename to "${newName}" by adding @@clientName to 'client.tsp' file`,
      fix: (fixContext: CodeFixContext) => {
        if (!existingClientNameDec) {
          let fix: InsertTextCodeFixEdit;
          const clientTsp = findClientTsp(context.program);
          const clientNameDecName =
            clientTsp && hasUsing(clientTsp, "Azure.ClientGenerator.Core")
              ? "@clientName"
              : "@Azure.ClientGenerator.Core.clientName";
          const targetName = getTypeName(target);
          if (clientTsp) {
            const p = clientTsp.file.text.length;
            fix = {
              kind: "insert-text",
              text: `\n@${clientNameDecName}(${targetName}, "${newName}", "csharp");`,
              pos: p,
              file: clientTsp.file,
            };
          } else {
            const root = context.program.projectRoot;
            const clientTspPath = join(root, "client.tsp");

            const s = createSourceFile("", clientTspPath);
            fix = {
              kind: "insert-text",
              text: `import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

@${clientNameDecName}(${targetName}, "${newName}", "csharp");`,
              pos: 0,
              file: s,
            };
          }
          return fix;
        } else {
          const location = getSourceLocation(existingClientNameDec.args[0].node!);
          return fixContext.replaceText(location, `"${newName}"`);
        }
      },
    };
  });
  return fixes;
}

/** a simple function to split name by upper case letters, plase be aware that non char letter like -_0-9 will be ignored */
export function splitNameByUpperCase(name: string): string[] {
  const parts = name.split(/(?=[A-Z])|[^a-zA-Z]+/);
  if (parts.length === 0) {
    return [];
  }
  const isUpperCaseLetter = (char: string) => char.length === 1 && char >= "A" && char <= "Z";
  const result = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    if (isUpperCaseLetter(parts[i]) && isUpperCaseLetter(parts[i - 1])) {
      result[result.length - 1] += parts[i];
    } else {
      result.push(parts[i]);
    }
  }
  return result.filter((part) => part.length > 0);
}

export function createRuleWithLmRuleChecker<
  const N extends string,
  const T extends DiagnosticMessages,
  const P extends object,
  const R extends AnyZodObject,
>(lmChecker: LmRuleChecker<P, R, T>, definition: LinterRuleDefinition<N, T>) {
  const createFunc = (context: LinterRuleContext<T>): SemanticNodeListener => {
    const listener = definition.create(context);
    return {
      ...definition.create(context),
      exitRoot: async (program) => {
        let result = undefined;
        if (listener.exitRoot) {
          result = await listener.exitRoot(program);
        }
        await lmChecker.checkAllData(context);
        return result;
      },
    };
  };
  return createRule({
    ...definition,
    create: createFunc,
  });
}
