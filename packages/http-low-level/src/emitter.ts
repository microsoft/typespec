import {
  BooleanLiteral,
  DecoratorApplication,
  EmitContext,
  Enum,
  EnumMember,
  Interface,
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
  formatTypeSpec,
} from "@typespec/compiler";
import { getHttpOperation } from "@typespec/http";

import {
  AssetEmitter,
  CodeTypeEmitter,
  Context,
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  Scope,
  SourceFile,
  SourceFileScope,
  StringBuilder,
  code,
} from "@typespec/compiler/emitter-framework";
import { HttpLowLevelOptions } from "./lib.js";

export async function $onEmit(context: EmitContext<HttpLowLevelOptions>) {
  const cls = class extends SingleFileEmitter {
    constructor(emitter: AssetEmitter<any, any>) {
      super(emitter, context.options);
    }
  };
  const assetEmitter = context.getAssetEmitter(cls);

  assetEmitter.emitProgram();
  await assetEmitter.writeOutput();
}

export function isArrayType(m: Model) {
  return m.name === "Array";
}

export class HttpLowLevelEmitter extends CodeTypeEmitter {
  omitDecorators: Set<string>;
  operationOmitDecorators: Set<any>;
  constructor(emitter: AssetEmitter<any, any>, options: HttpLowLevelOptions) {
    super(emitter);
    this.omitDecorators = new Set([
      "friendlyName",
      "withOptionalProperties",
      "withUpdateableProperties",
    ]);

    if (options["ignore-docs"]) {
      this.omitDecorators.add("doc");
      this.omitDecorators.add("summary");
    }

    this.operationOmitDecorators = new Set([
      ...this.omitDecorators,
      "autoRoute",
      "route",
      "get",
      "post",
      "patch",
      "put",
      "delete",
    ]);
  }

  // type literals
  booleanLiteral(boolean: BooleanLiteral) {
    return JSON.stringify(boolean.value);
  }

  numericLiteral(number: NumericLiteral) {
    return JSON.stringify(number.value);
  }

  stringLiteral(string: StringLiteral) {
    return JSON.stringify(string.value);
  }

  scalarDeclaration(scalar: Scalar) {
    return scalar.name;
  }

  modelLiteral(model: Model) {
    if (isArrayType(model)) {
      return this.emitter.result.rawCode(
        code`${this.emitter.emitTypeReference(model.indexer!.value!)}[]`
      );
    }

    return this.emitter.result.rawCode(code`{ ${this.emitter.emitModelProperties(model)}}`);
  }

  modelDeclaration(model: Model, name: string) {
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

  modelInstantiation(model: Model, name: string) {
    return this.modelDeclaration(model, name);
  }

  modelPropertyLiteral(property: ModelProperty) {
    const name = property.name === "_" ? "statusCode" : property.name;

    return this.emitter.result.rawCode(
      code`${this.emitDecorators(property)}${name}${
        property.optional ? "?" : ""
      }: ${this.emitter.emitTypeReference(property.type)}`
    );
  }

  operationDeclaration(operation: Operation, name: string) {
    return this.emitter.result.declaration(
      name,
      code`${this.operationDecorators(operation)} op ${name}${this.#operationSignature(operation)}`
    );
  }

  operationDecorators(operation: Operation) {
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);
    return [
      this.emitDecorators(operation, this.operationOmitDecorators),
      `@${httpOperation.verb}`,
      `@route("${httpOperation.path}")`,
    ].join("\n");
  }

  emitDecorators(
    type: Type & { decorators: DecoratorApplication[] },
    exclude: Set<string> = this.omitDecorators
  ) {
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

  operationParameters(operation: Operation, parameters: Model) {
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);
    const cb = new StringBuilder();
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

  operationReturnType(operation: Operation, returnType: Type) {
    const [httpOperation] = getHttpOperation(this.emitter.getProgram(), operation);

    return httpOperation.responses
      .flatMap((statusCodeResponse) => {
        return statusCodeResponse.responses.map((contentTypeResponse) => {
          let body: string | StringBuilder = "";
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

  interfaceDeclaration(iface: Interface, name: string) {
    return this.emitter.result.declaration(
      name,
      code`
      interface ${name} {
        ${this.emitter.emitInterfaceOperations(iface)}
      }
    `
    );
  }

  interfaceOperationDeclaration(operation: Operation, name: string) {
    return code`${this.operationDecorators(operation)}${name}${this.#operationSignature(
      operation
    )}\n\n`;
  }

  enumDeclaration(en: Enum, name: string) {
    return this.emitter.result.declaration(
      name,
      code`export enum ${name} {
        ${this.emitter.emitEnumMembers(en)}
      }`
    );
  }

  enumMember(member: EnumMember) {
    // should we just fill in value for you?
    const value = !member.value ? member.name : member.value;

    return `
      ${member.name} = ${JSON.stringify(value)}
    `;
  }

  unionDeclaration(union: Union, name: string) {
    return this.emitter.result.declaration(
      name,
      code`export type ${name} = ${this.emitter.emitUnionVariants(union)}`
    );
  }

  unionInstantiation(union: Union, name: string) {
    return this.unionDeclaration(union, name);
  }

  unionLiteral(union: Union) {
    return this.emitter.emitUnionVariants(union);
  }

  unionVariants(union: Union) {
    const builder = new StringBuilder();
    let i = 0;
    for (const variant of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(variant)}${i < union.variants.size ? "|" : ""}`);
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  unionVariant(variant: UnionVariant) {
    return this.emitter.emitTypeReference(variant.type);
  }

  tupleLiteral(tuple: Tuple) {
    return code`[${this.emitter.emitTupleLiteralValues(tuple)}]`;
  }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null
  ): string | EmitEntity<string> {
    if (!commonScope) {
      const sourceSf = (pathUp[0] as SourceFileScope<any>).sourceFile;
      const targetSf = (pathDown[0] as SourceFileScope<any>).sourceFile;
      sourceSf.imports.set(`./${targetSf.path.replace(".js", ".ts")}`, [targetDeclaration.name]);
    }

    return super.reference(targetDeclaration, pathUp, pathDown, commonScope);
  }

  sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
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

    try {
      emittedSourceFile.contents = formatTypeSpec(emittedSourceFile.contents);
    } catch (e) {
      console.error(e);
      this.emitter.getProgram().reportDiagnostic({
        code: "format-fail",
        severity: "warning",
        message: `Failed to format: ${e}`,
        target: NoTarget,
      });
    }
    return emittedSourceFile;
  }
}

class SingleFileEmitter extends HttpLowLevelEmitter {
  programContext(): Context {
    const outputFile = this.emitter.createSourceFile("cadl-output/output.tsp");
    return { scope: outputFile.globalScope };
  }
}
