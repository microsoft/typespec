import * as prettier from "prettier";
import {
  BooleanLiteral,
  Enum,
  EnumMember,
  getDoc,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "../../src/index.js";

import {
  code,
  CodeTypeEmitter,
  Declaration,
  EmittedSourceFile,
  EmitterOutput,
  Scope,
  SourceFile,
  SourceFileScope,
  StringBuilder,
} from "../../src/emitter-framework/index.js";

export function isArrayType(m: Model) {
  return m.name === "Array";
}

export const intrinsicNameToTSType = new Map<string, string>([
  ["unknown", "unknown"],
  ["string", "string"],
  ["int32", "number"],
  ["int16", "number"],
  ["float16", "number"],
  ["float32", "number"],
  ["int64", "bigint"],
  ["boolean", "boolean"],
  ["null", "null"],
]);

export class TypeScriptInterfaceEmitter extends CodeTypeEmitter {
  // type literals
  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<string> {
    return JSON.stringify(boolean.value);
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<string> {
    return JSON.stringify(number.value);
  }

  stringLiteral(string: StringLiteral): EmitterOutput<string> {
    return JSON.stringify(string.value);
  }

  scalarDeclaration(scalar: Scalar, scalarName: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(scalarName)) {
      throw new Error("Unknown scalar type " + scalarName);
    }

    const code = intrinsicNameToTSType.get(scalarName)!;
    return this.emitter.result.rawCode(code);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(name)) {
      throw new Error("Unknown intrinsic type " + name);
    }

    const code = intrinsicNameToTSType.get(name)!;
    return this.emitter.result.rawCode(code);
  }

  modelLiteral(model: Model): EmitterOutput<string> {
    return this.emitter.result.rawCode(code`{ ${this.emitter.emitModelProperties(model)}}`);
  }

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
    let extendsClause;

    if (model.baseModel) {
      extendsClause = code`extends ${this.emitter.emitTypeReference(model.baseModel)}`;
    } else {
      extendsClause = "";
    }

    const comment = getDoc(this.emitter.getProgram(), model);
    let commentCode = "";

    if (comment) {
      commentCode = `
        /**
         * ${comment}
         */`;
    }

    return this.emitter.result.declaration(
      name,
      code`${commentCode}\nexport interface ${name} ${extendsClause} {
        ${this.emitter.emitModelProperties(model)}
      }`,
    );
  }

  modelInstantiation(model: Model, name: string): EmitterOutput<string> {
    if (this.emitter.getProgram().checker.isStdType(model, "Record")) {
      const indexerValue = model.indexer!.value;
      return code`Record<string, ${this.emitter.emitTypeReference(indexerValue)}>`;
    }
    return this.modelDeclaration(model, name);
  }

  modelPropertyLiteral(property: ModelProperty): EmitterOutput<string> {
    const name = property.name === "_" ? "statusCode" : property.name;
    const doc = getDoc(this.emitter.getProgram(), property);
    let docString = "";

    if (doc) {
      docString = `
      /**
       * ${doc}
       */
      `;
    }

    return this.emitter.result.rawCode(
      code`${docString}${name}${property.optional ? "?" : ""}: ${this.emitter.emitTypeReference(
        property.type,
      )}`,
    );
  }

  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`interface ${name} extends Array<${this.emitter.emitTypeReference(elementType)}> { };`,
    );
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<string> {
    // we always parenthesize here as prettier will remove the unneeded parens.
    return this.emitter.result.rawCode(code`(${this.emitter.emitTypeReference(elementType)})[]`);
  }

  operationDeclaration(operation: Operation, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`interface ${name} {
      ${this.#operationSignature(operation)}
    }`,
    );
  }

  operationParameters(operation: Operation, parameters: Model): EmitterOutput<string> {
    const cb = new StringBuilder();
    for (const prop of parameters.properties.values()) {
      cb.push(
        code`${prop.name}${prop.optional ? "?" : ""}: ${this.emitter.emitTypeReference(prop.type)},`,
      );
    }
    return cb;
  }

  #operationSignature(operation: Operation) {
    return code`(${this.emitter.emitOperationParameters(
      operation,
    )}): ${this.emitter.emitOperationReturnType(operation)}`;
  }

  operationReturnType(operation: Operation, returnType: Type): EmitterOutput<string> {
    return this.emitter.emitTypeReference(returnType);
  }

  interfaceDeclaration(iface: Interface, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`
      export interface ${name} {
        ${this.emitter.emitInterfaceOperations(iface)}
      }
    `,
    );
  }

  interfaceOperationDeclaration(operation: Operation, name: string): EmitterOutput<string> {
    return code`${name}${this.#operationSignature(operation)}`;
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export enum ${name} {
        ${this.emitter.emitEnumMembers(en)}
      }`,
    );
  }

  enumMember(member: EnumMember): EmitterOutput<string> {
    // should we just fill in value for you?
    const value = !member.value ? member.name : member.value;

    return `
      ${member.name} = ${JSON.stringify(value)}
    `;
  }

  enumMemberReference(member: EnumMember): EmitterOutput<string> {
    return `${this.emitter.emitDeclarationName(member.enum)}.${member.name}`;
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export type ${name} = ${this.emitter.emitUnionVariants(union)}`,
    );
  }

  unionInstantiation(union: Union, name: string): EmitterOutput<string> {
    return this.unionDeclaration(union, name);
  }

  unionLiteral(union: Union) {
    return this.emitter.emitUnionVariants(union);
  }

  unionVariants(union: Union): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const variant of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(variant)}${i < union.variants.size ? "|" : ""}`);
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  unionVariant(variant: UnionVariant): EmitterOutput<string> {
    return this.emitter.emitTypeReference(variant.type);
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<string> {
    return code`[${this.emitter.emitTupleLiteralValues(tuple)}]`;
  }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null,
  ) {
    if (!commonScope) {
      const sourceSf = (pathUp[0] as SourceFileScope<string>).sourceFile;
      const targetSf = (pathDown[0] as SourceFileScope<string>).sourceFile;
      sourceSf.imports.set(`./${targetSf.path.replace(".js", ".ts")}`, [targetDeclaration.name]);
    }

    return super.reference(targetDeclaration, pathUp, pathDown, commonScope);
  }

  async sourceFile(sourceFile: SourceFile<string>): Promise<EmittedSourceFile> {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const [importPath, typeNames] of sourceFile.imports) {
      emittedSourceFile.contents += `import {${typeNames.join(",")}} from "${importPath}";\n`;
    }

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.value + "\n";
    }

    emittedSourceFile.contents = await prettier.format(emittedSourceFile.contents, {
      parser: "typescript",
    });
    return emittedSourceFile;
  }
}
