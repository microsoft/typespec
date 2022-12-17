import {
  BooleanLiteral,
  Enum,
  EnumMember,
  formatCadl,
  getDoc,
  Interface,
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
} from "@cadl-lang/compiler";
import { EmitContext } from "@cadl-lang/compiler/core";
import { getHttpOperation } from "@cadl-lang/rest/http";

import {
  code,
  CodeBuilder,
  Context,
  createEmitterContext,
  Declaration,
  EmitEntityOrString,
  EmittedSourceFile,
  Scope,
  SourceFile,
  SourceFileScope,
  TypeEmitter,
} from "./emitter-framework/index.js";
export async function $onEmit(context: EmitContext) {
  const emitterContext = createEmitterContext(context.program);
  const emitter = emitterContext.createAssetEmitter(SingleFileEmitter, {});
  emitter.emitProgram();
  await emitter.writeOutput();
}

export function isArrayType(m: Model) {
  return m.name === "Array";
}

export class HttpLowLevelEmitter extends TypeEmitter {
  // type literals
  booleanLiteral(boolean: BooleanLiteral): EmitEntityOrString {
    return JSON.stringify(boolean.value);
  }

  numericLiteral(number: NumericLiteral): EmitEntityOrString {
    return JSON.stringify(number.value);
  }

  stringLiteral(string: StringLiteral): EmitEntityOrString {
    return JSON.stringify(string.value);
  }

  modelScalar(scalar: Scalar): EmitEntityOrString {
    return this.emitter.result.rawCode(scalar.name);
  }

  modelLiteral(model: Model): EmitEntityOrString {
    if (isArrayType(model)) {
      return this.emitter.result.rawCode(
        code`${this.emitter.emitTypeReference(model.indexer!.value!)}[]`
      );
    }

    return this.emitter.result.rawCode(code`{ ${this.emitter.emitModelProperties(model)}}`);
  }

  modelDeclaration(model: Model, name: string): EmitEntityOrString {
    let extendsClause;
    if (model.indexer && model.indexer.key!.name === "integer") {
      extendsClause = code`extends Array<${this.emitter.emitTypeReference(model.indexer!.value!)}>`;
    } else if (model.baseModel) {
      extendsClause = code`extends ${this.emitter.emitTypeReference(model.baseModel)}`;
    } else {
      extendsClause = "";
    }

    let comment = getDoc(this.emitter.getProgram(), model);
    let commentCode = "";

    if (comment) {
      commentCode = `
        /**
         * ${comment}
         */`;
    }

    return this.emitter.result.declaration(
      name,
      code`${commentCode}\nmodel ${name} ${extendsClause} {
        ${this.emitter.emitModelProperties(model)}
      }`
    );
  }

  modelInstantiation(model: Model, name: string): EmitEntityOrString {
    return this.modelDeclaration(model, name);
  }

  modelPropertyLiteral(property: ModelProperty): EmitEntityOrString {
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
        property.type
      )}`
    );
  }

  operationDeclaration(operation: Operation, name: string): EmitEntityOrString {
    return this.emitter.result.declaration(
      name,
      code`${this.operationDecorators(operation)} op ${name}${this.#operationSignature(operation)}`
    );
  }

  operationDecorators(operation: Operation) {
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);
    return [`@${httpOperation.verb}`, `@route("${httpOperation.path}")`].join("\n");
  }

  operationParameters(operation: Operation, parameters: Model): EmitEntityOrString {
    const cb = new CodeBuilder();
    for (const prop of parameters.properties.values()) {
      cb.push(
        code`${prop.name}${prop.optional ? "?" : ""}: ${this.emitter.emitTypeReference(prop.type)},`
      );
    }
    return cb;
  }

  #operationSignature(operation: Operation) {
    return code`(${this.emitter.emitOperationParameters(
      operation
    )}): ${this.emitter.emitOperationReturnType(operation)}`;
  }

  operationReturnType(operation: Operation, returnType: Type): EmitEntityOrString {
    // return this.emitter.emitTypeReference(returnType);
    return "void";
  }

  interfaceDeclaration(iface: Interface, name: string): EmitEntityOrString {
    return this.emitter.result.declaration(
      name,
      code`
      interface ${name} {
        ${this.emitter.emitInterfaceOperations(iface)}
      }
    `
    );
  }

  interfaceOperationDeclaration(operation: Operation, name: string): EmitEntityOrString {
    return code`${this.operationDecorators(operation)}${name}${this.#operationSignature(
      operation
    )}`;
  }

  enumDeclaration(en: Enum, name: string): EmitEntityOrString {
    return this.emitter.result.declaration(
      name,
      code`export enum ${name} {
        ${this.emitter.emitEnumMembers(en)}
      }`
    );
  }

  enumMember(member: EnumMember): EmitEntityOrString {
    // should we just fill in value for you?
    const value = !member.value ? member.name : member.value;

    return `
      ${member.name} = ${JSON.stringify(value)}
    `;
  }

  unionDeclaration(union: Union, name: string): EmitEntityOrString {
    return this.emitter.result.declaration(
      name,
      code`export type ${name} = ${this.emitter.emitUnionVariants(union)}`
    );
  }

  unionInstantiation(union: Union, name: string): EmitEntityOrString {
    return this.unionDeclaration(union, name);
  }

  unionLiteral(union: Union) {
    return this.emitter.emitUnionVariants(union);
  }

  unionVariants(union: Union): EmitEntityOrString {
    const builder = new CodeBuilder();
    let i = 0;
    for (const variant of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(variant)}${i < union.variants.size ? "|" : ""}`);
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  unionVariant(variant: UnionVariant): EmitEntityOrString {
    return this.emitter.emitTypeReference(variant.type);
  }

  tupleLiteral(tuple: Tuple): EmitEntityOrString {
    return code`[${this.emitter.emitTupleLiteralValues(tuple)}]`;
  }

  reference(
    targetDeclaration: Declaration,
    pathUp: Scope[],
    pathDown: Scope[],
    commonScope: Scope | null
  ) {
    if (!commonScope) {
      const sourceSf = (pathUp[0] as SourceFileScope).sourceFile;
      const targetSf = (pathDown[0] as SourceFileScope).sourceFile;
      console.log(sourceSf, targetSf);
      sourceSf.imports.set(`./${targetSf.path.replace(".js", ".ts")}`, [targetDeclaration.name]);
    }

    return super.reference(targetDeclaration, pathUp, pathDown, commonScope);
  }

  sourceFile(sourceFile: SourceFile): EmittedSourceFile {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const [importPath, typeNames] of sourceFile.imports) {
      emittedSourceFile.contents += `import {${typeNames.join(",")}} from "${importPath}";\n`;
    }

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.code + "\n";
    }

    try {
      emittedSourceFile.contents = formatCadl(emittedSourceFile.contents);
    } catch (e) {
      console.error("failed to format", e);
    }
    return emittedSourceFile;
  }
}

class SingleFileEmitter extends HttpLowLevelEmitter {
  programContext(): Context {
    const outputFile = this.emitter.createSourceFile("cadl-output/output.cadl");
    return { scope: outputFile.globalScope };
  }
}
