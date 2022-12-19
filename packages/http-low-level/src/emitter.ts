import {
  BooleanLiteral,
  DecoratorApplication,
  EmitContext,
  Enum,
  EnumMember,
  formatCadl,
  Interface,
  isVoidType,
  Model,
  ModelProperty,
  NoTarget,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "@cadl-lang/compiler";
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

    return this.emitter.result.declaration(
      name,
      code`${this.emitDecorators(model)}\nmodel ${name} ${extendsClause} {
        ${this.emitter.emitModelProperties(model)}
      }\n\n`
    );
  }

  modelInstantiation(model: Model, name: string): EmitEntityOrString {
    return this.modelDeclaration(model, name);
  }

  modelPropertyLiteral(property: ModelProperty): EmitEntityOrString {
    const name = property.name === "_" ? "statusCode" : property.name;

    return this.emitter.result.rawCode(
      code`${this.emitDecorators(property)}${name}${
        property.optional ? "?" : ""
      }: ${this.emitter.emitTypeReference(property.type)}`
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
    return [
      this.emitDecorators(operation, [
        "autoRoute",
        "route",
        "get",
        "post",
        "patch",
        "put",
        "delete",
      ]),
      `@${httpOperation.verb}`,
      `@route("${httpOperation.path}")`,
    ].join("\n");
  }

  emitDecorators(type: Type & { decorators: DecoratorApplication[] }, exclude: string[] = []) {
    const exclusion = new Set(exclude);

    return type.decorators
      .filter((x) => !exclusion.has(x.decorator.name.slice(1)))
      .map((x) => this.emitDecoratorApplication(x))
      .join("\n");
  }
  emitDecoratorApplication(decoratorApplication: DecoratorApplication) {
    const name = "@" + decoratorApplication.decorator.name.slice(1);
    const args = decoratorApplication.args.map(
      (x) => code`${this.emitter.emitTypeReference(x.value)}`
    );
    return `${name}(${args.join(",")})`;
  }

  operationParameters(operation: Operation, parameters: Model): EmitEntityOrString {
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);
    const cb = new CodeBuilder();
    for (const parameter of httpOperation.parameters.parameters) {
      cb.push(code`${this.emitter.emitModelProperty(parameter.param)}, `);
    }

    if (httpOperation.parameters.body) {
      cb.push(this.#emitContentTypeProperty(httpOperation.parameters.body.contentTypes));
      cb.push(",");
      cb.push(
        code`@body ${
          httpOperation.parameters.body.parameter?.name ?? "body"
        }: ${this.emitter.emitTypeReference(httpOperation.parameters.body.type)}`
      );
    }
    return cb;
  }

  #emitContentTypeProperty(contentTypes: string[]) {
    if (contentTypes.length === 0) {
      contentTypes = ["application/json"];
    }
    const types = contentTypes.map((x) => `"${x}"`).join(" | ");
    return `@header contentType: ${types}`;
  }

  #operationSignature(operation: Operation) {
    return code`(${this.emitter.emitOperationParameters(
      operation
    )}): ${this.emitter.emitOperationReturnType(operation)}`;
  }

  operationReturnType(operation: Operation, returnType: Type): EmitEntityOrString {
    if (isVoidType(returnType)) {
      return "void";
    }
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);

    return httpOperation.responses
      .flatMap((statusCodeResponse) => {
        return statusCodeResponse.responses.map((contentTypeResponse) => {
          let body: string | CodeBuilder = "";
          if (contentTypeResponse.body) {
            body = code`${this.#emitContentTypeProperty(
              contentTypeResponse.body.contentTypes
            )}, @body body: ${this.emitter.emitTypeReference(contentTypeResponse.body.type)}`;
          }
          return `{
            @statusCode _: ${
              statusCodeResponse.statusCode === "*" ? `"*"` : statusCodeResponse.statusCode
            },
            ${Object.values(contentTypeResponse.headers ?? [])
              .map((x) => code`${this.emitter.emitModelProperty(x)}`)
              .join(", ")}
            ${body}
          }`;
        });
      })
      .join(" | ");
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
    )}\n\n`;
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
      this.emitter.getProgram().reportDiagnostic({
        code: "format-fail",
        severity: "warning",
        message: "Failed to format",
        target: NoTarget,
      });
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
