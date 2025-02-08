import {
  BooleanLiteral,
  EmitContext,
  Enum,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  Scalar,
  Service,
  StringLiteral,
  StringTemplate,
  StringTemplateSpan,
  Tuple,
  Type,
  Union,
  getDoc,
  getNamespaceFullName,
  getService,
  isErrorModel,
  isNeverType,
  isNullType,
  isTemplateDeclaration,
  isVoidType,
} from "@typespec/compiler";
import {
  CodeTypeEmitter,
  Context,
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  EmitterOutput,
  Scope,
  SourceFile,
  StringBuilder,
  TypeSpecDeclaration,
  code,
  createAssetEmitter,
} from "@typespec/compiler/emitter-framework";
import { createRekeyableMap } from "@typespec/compiler/utils";
import {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationResponse,
  MetadataInfo,
  Visibility,
  createMetadataInfo,
  getHeaderFieldName,
  getHttpOperation,
  getHttpPart,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "@typespec/http";
import { getResourceOperation } from "@typespec/rest";
import { execFile } from "child_process";
import {
  GeneratedFileHeader,
  GeneratedFileHeaderWithNullable,
  getSerializationSourceFiles,
} from "./boilerplate.js";
import {
  CSharpSourceType,
  CSharpType,
  CSharpTypeMetadata,
  ControllerContext,
  LibrarySourceFile,
  NameCasingType,
  ResponseInfo,
} from "./interfaces.js";
import { CSharpServiceEmitterOptions, reportDiagnostic } from "./lib.js";
import {
  BusinessLogicImplementation,
  BusinessLogicMethod,
  BusinessLogicRegistrations,
  getBusinessLogicImplementations,
  getScaffoldingHelpers,
} from "./scaffolding.js";
import { getRecordType, isKnownReferenceType } from "./type-helpers.js";
import {
  HttpMetadata,
  UnknownType,
  coalesceTypes,
  ensureCSharpIdentifier,
  ensureCleanDirectory,
  formatComment,
  getCSharpIdentifier,
  getCSharpStatusCode,
  getCSharpType,
  getCSharpTypeForIntrinsic,
  getCSharpTypeForScalar,
  getModelAttributes,
  getModelInstantiationName,
  getOperationVerbDecorator,
  isValueType,
} from "./utils.js";

export async function $onEmit(context: EmitContext<CSharpServiceEmitterOptions>) {
  let _unionCounter: number = 0;
  const controllers = new Map<string, ControllerContext>();
  const NoResourceContext: string = "RPCOperations";
  const doNotEmit: boolean = context.program.compilerOptions.noEmit || false;

  class CSharpCodeEmitter extends CodeTypeEmitter {
    #metadateMap: Map<Type, CSharpTypeMetadata> = new Map<Type, CSharpTypeMetadata>();
    #generatedFileHeaderWithNullable: string = GeneratedFileHeaderWithNullable;
    #generatedFileHeader: string = GeneratedFileHeader;
    #sourceTypeKey: string = "sourceType";
    #libraryFiles: LibrarySourceFile[] = getSerializationSourceFiles(this.emitter);
    #baseNamespace: string | undefined = undefined;
    #emitterOutputType = context.options["output-type"];
    #emitMocks: string | undefined = context.options["emit-mocks"];
    #useSwagger: boolean = context.options["use-swaggerui"] || false;
    #openapiPath: string = context.options["openapi-path"] || "openapi/openapi.yaml";
    #mockRegistrations: BusinessLogicRegistrations = new Map<string, BusinessLogicImplementation>();
    #mockHelpers: LibrarySourceFile[] =
      this.#emitMocks === "all"
        ? getScaffoldingHelpers(this.emitter, this.#useSwagger, this.#openapiPath)
        : [];
    #mockFiles: LibrarySourceFile[] = [];

    #metaInfo: MetadataInfo = createMetadataInfo(this.emitter.getProgram(), {
      canonicalVisibility: Visibility.Read,
      canShareProperty: (p) => true,
    });

    arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<string> {
      return this.emitter.result.declaration(
        ensureCSharpIdentifier(this.emitter.getProgram(), array, name),
        code`${this.emitter.emitTypeReference(elementType)}[]`,
      );
    }

    arrayLiteral(array: Model, elementType: Type): EmitterOutput<string> {
      return this.emitter.result.rawCode(code`${this.emitter.emitTypeReference(elementType)}[]`);
    }

    booleanLiteral(boolean: BooleanLiteral): EmitterOutput<string> {
      return this.emitter.result.rawCode(code`${boolean.value === true ? "true" : "false"}`);
    }

    unionLiteral(union: Union): EmitterOutput<string> {
      const csType = this.#coalesceUnionTypes(union);
      return this.emitter.result.rawCode(csType && csType.isBuiltIn ? csType.name : "object");
    }

    declarationName(declarationType: TypeSpecDeclaration): string {
      switch (declarationType.kind) {
        case "Enum":
          if (!declarationType.name) return `Enum${_unionCounter++}`;
          return getCSharpIdentifier(declarationType.name, NameCasingType.Class);
        case "Interface":
          if (!declarationType.name) return `Interface${_unionCounter++}`;
          return getCSharpIdentifier(declarationType.name, NameCasingType.Class);
        case "Model":
          if (!declarationType.name) return `Model${_unionCounter++}`;
          return getCSharpIdentifier(declarationType.name, NameCasingType.Class);
        case "Operation":
          return getCSharpIdentifier(declarationType.name, NameCasingType.Class);
        case "Union":
          if (!declarationType.name) return `Union${_unionCounter++}`;
          return getCSharpIdentifier(declarationType.name, NameCasingType.Class);
        case "Scalar":
        default:
          return getCSharpIdentifier(declarationType.name, NameCasingType.Variable);
      }
    }

    enumDeclaration(en: Enum, name: string): EmitterOutput<string> {
      const program = this.emitter.getProgram();
      const enumName = ensureCSharpIdentifier(program, en, name);
      const namespace = this.emitter.getContext().namespace;
      const doc = getDoc(this.emitter.getProgram(), en);
      const attributes = getModelAttributes(program, en, enumName);
      this.#metadateMap.set(en, new CSharpType({ name: enumName, namespace: namespace }));
      return this.emitter.result.declaration(
        enumName,
        code`${this.#generatedFileHeader}
        
        ${this.#emitUsings()}
        
        namespace ${namespace}
        {

            ${doc ? `${formatComment(doc)}` : ""}
            ${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}
            public enum ${enumName}
            {
              ${this.emitter.emitEnumMembers(en)};
            }
        } `,
      );
    }

    enumDeclarationContext(en: Enum): Context {
      const enumName = ensureCSharpIdentifier(this.emitter.getProgram(), en, en.name);
      const enumFile = this.emitter.createSourceFile(`models/${enumName}.cs`);
      enumFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const enumNamespace = `${this.#getOrSetBaseNamespace(en)}.Models`;
      return {
        namespace: enumNamespace,
        file: enumFile,
        scope: enumFile.globalScope,
      };
    }

    enumMembers(en: Enum): EmitterOutput<string> {
      const result = new StringBuilder();
      let i = 0;
      for (const [name, member] of en.members) {
        i++;
        const memberName: string = ensureCSharpIdentifier(this.emitter.getProgram(), member, name);
        this.#metadateMap.set(member, { name: memberName });
        result.push(
          code`${ensureCSharpIdentifier(this.emitter.getProgram(), member, name)} = "${
            member.value ? (member.value as string) : name
          }"`,
        );
        if (i < en.members.size) result.pushLiteralSegment(", ");
      }

      return this.emitter.result.rawCode(result.reduce());
    }

    intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<string> {
      switch (intrinsic.name) {
        case "unknown":
          return this.emitter.result.rawCode(code`System.Text.Json.Nodes.JsonNode`);
        case "null":
          return this.emitter.result.rawCode(code`System.Text.Json.Nodes.JsonNode`);
        case "ErrorType":
        case "never":
          reportDiagnostic(this.emitter.getProgram(), {
            code: "invalid-intrinsic",
            target: intrinsic,
            format: { typeName: intrinsic.name },
          });
          return "";
        case "void":
          const type = getCSharpTypeForIntrinsic(this.emitter.getProgram(), intrinsic);
          return this.emitter.result.rawCode(`${type?.type.getTypeReference()}`);
      }
    }

    #emitUsings(file?: SourceFile<string>): EmitterOutput<string> {
      const builder: StringBuilder = new StringBuilder();
      if (file === undefined) {
        file = this.emitter.getContext().file!;
      }
      for (const ns of [...file!.imports.keys()]) builder.pushLiteralSegment(`using ${ns};`);
      return builder.segments.join("\n");
    }

    modelDeclaration(model: Model, name: string): EmitterOutput<string> {
      const parts = this.#getMultipartParts(model);
      if (parts.length > 0) {
        parts.forEach((p) => this.emitter.emitType(p));
        return "";
      }
      const className = ensureCSharpIdentifier(this.emitter.getProgram(), model, name);
      const namespace = this.emitter.getContext().namespace;
      const doc = getDoc(this.emitter.getProgram(), model);
      const attributes = getModelAttributes(this.emitter.getProgram(), model, className);
      this.#metadateMap.set(model, new CSharpType({ name: className, namespace: namespace }));
      const decl = this.emitter.result.declaration(
        className,
        code`${this.#generatedFileHeader}

      ${this.#emitUsings()}
      
      namespace ${namespace} {

      ${doc ? `${formatComment(doc)}\n` : ""}${`${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}${attributes?.length > 0 ? "\n" : ""}`}public partial class ${className} ${
        model.baseModel ? code`: ${this.emitter.emitTypeReference(model.baseModel)}` : ""
      } {
      ${this.emitter.emitModelProperties(model)}
    }
   } `,
      );

      return decl;
    }

    modelDeclarationContext(model: Model, name: string): Context {
      if (this.#isMultipartModel(model)) return {};
      const modelName = ensureCSharpIdentifier(this.emitter.getProgram(), model, name);
      const modelFile = this.emitter.createSourceFile(`models/${modelName}.cs`);
      modelFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const modelNamespace = `${this.#getOrSetBaseNamespace(model)}.Models`;
      return this.#createModelContext(modelNamespace, modelFile, modelName);
    }

    modelInstantiationContext(model: Model): Context {
      if (this.#isMultipartModel(model)) return {};
      const modelName: string = getModelInstantiationName(
        this.emitter.getProgram(),
        model,
        model.name,
      );
      const sourceFile = this.emitter.createSourceFile(`models/${modelName}.cs`);
      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const modelNamespace = `${this.#getOrSetBaseNamespace(model)}.Models`;
      const context = this.#createModelContext(modelNamespace, sourceFile, model.name);
      context.instantiationName = modelName;
      return context;
    }

    modelInstantiation(model: Model, name: string): EmitterOutput<string> {
      const parts = this.#getMultipartParts(model);
      if (parts.length > 0) {
        parts.forEach((p) => this.emitter.emitType(p));
        return "";
      }
      const program = this.emitter.getProgram();
      const recordType = getRecordType(program, model);
      if (recordType !== undefined) {
        return code`Dictionary<string, ${this.emitter.emitTypeReference(recordType)}>`;
      }

      const context = this.emitter.getContext();
      const className = context.instantiationName ?? name;
      return this.modelDeclaration(model, className);
    }

    #getMultipartParts(model: Model): Type[] {
      const parts: Type[] = [...model.properties.values()]
        .flatMap((p) => getHttpPart(this.emitter.getProgram(), p.type)?.type)
        .filter((t) => t !== undefined);
      if (model.baseModel) {
        return parts.concat(this.#getMultipartParts(model.baseModel));
      }

      return parts;
    }

    #isMultipartModel(model: Model): boolean {
      const multipartTypes = this.#getMultipartParts(model);
      return multipartTypes.length > 0;
    }

    modelProperties(model: Model): EmitterOutput<string> {
      const result: StringBuilder = new StringBuilder();
      for (const [_, prop] of model.properties) {
        if (
          !isVoidType(prop.type) &&
          !isNeverType(prop.type) &&
          !isNullType(prop.type) &&
          !isErrorModel(this.emitter.getProgram(), prop.type)
        ) {
          result.push(code`${this.emitter.emitModelProperty(prop)}`);
        }
      }

      return result.reduce();
    }

    modelLiteralContext(model: Model): Context {
      const name = this.emitter.emitDeclarationName(model) || "";
      return this.modelDeclarationContext(model, name);
    }

    modelLiteral(model: Model): EmitterOutput<string> {
      const modelName: string = this.emitter.getContext().name;
      reportDiagnostic(this.emitter.getProgram(), {
        code: "anonymous-model",
        target: model,
        format: { emittedName: modelName },
      });
      return this.modelDeclaration(model, modelName);
    }

    #isRecord(type: Type): boolean {
      return type.kind === "Model" && type.name === "Record" && type.indexer !== undefined;
    }

    #isInheritedProperty(property: ModelProperty): boolean {
      const visited: Model[] = [];
      function isInherited(model: Model, propertyName: string) {
        if (visited.includes(model)) return false;
        visited.push(model);
        if (model.properties.has(propertyName)) return true;
        if (model.baseModel === undefined) return false;
        return isInherited(model.baseModel, propertyName);
      }
      const model = property.model;
      if (model === undefined || model.baseModel === undefined) return false;
      return isInherited(model.baseModel, property.name);
    }

    modelPropertyLiteral(property: ModelProperty): EmitterOutput<string> {
      if (isStatusCode(this.emitter.getProgram(), property)) return "";
      const propertyName = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        property,
        property.name,
      );

      const [typeName, typeDefault, nullable] = this.#findPropertyType(property);
      const doc = getDoc(this.emitter.getProgram(), property);
      const attributes = getModelAttributes(this.emitter.getProgram(), property, propertyName);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const defaultValue = property.default
        ? // eslint-disable-next-line @typescript-eslint/no-deprecated
          code`${this.emitter.emitType(property.default)}`
        : typeDefault;
      return this.emitter.result
        .rawCode(code`${doc ? `${formatComment(doc)}\n` : ""}${`${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}${attributes?.length > 0 ? "\n" : ""}`}public ${this.#isInheritedProperty(property) ? "new " : ""}${typeName}${
        isValueType(this.emitter.getProgram(), property.type) && (property.optional || nullable)
          ? "?"
          : ""
      } ${propertyName} { get; ${typeDefault ? "}" : "set; }"}${
        defaultValue ? ` = ${defaultValue};\n` : "\n"
      }
    `);
    }

    #findPropertyType(
      property: ModelProperty,
    ): [EmitterOutput<string>, string | boolean | undefined, boolean] {
      return this.#getTypeInfoForTsType(property.type);
    }

    #isMultipartRequest(operation: HttpOperation): boolean {
      const body = operation.parameters.body;
      if (body === undefined) return false;
      return body.bodyKind === "multipart";
    }

    #hasMultipartOperation(iface: Interface): boolean {
      for (const [_, operation] of iface.operations) {
        const [httpOp, _] = getHttpOperation(this.emitter.getProgram(), operation);
        if (this.#isMultipartRequest(httpOp)) return true;
      }

      return false;
    }

    #getTypeInfoForUnion(
      union: Union,
    ): [EmitterOutput<string>, string | boolean | undefined, boolean] {
      const propResult = this.#getNonNullableTsType(union);
      if (propResult === undefined) {
        return [
          code`${emitter.emitTypeReference(union)}`,
          undefined,
          [...union.variants.values()].filter((v) => isNullType(v.type)).length > 0,
        ];
      }
      const [typeName, typeDefault, _] = this.#getTypeInfoForTsType(propResult.type);
      return [typeName, typeDefault, propResult.nullable];
    }
    #getTypeInfoForTsType(
      tsType: Type,
    ): [EmitterOutput<string>, string | boolean | undefined, boolean] {
      function extractStringValue(type: Type, span: StringTemplateSpan): string {
        switch (type.kind) {
          case "String":
            return type.value;
          case "Boolean":
            return `${type.value}`;
          case "Number":
            return type.valueAsString;
          case "StringTemplateSpan":
            if (type.isInterpolated) {
              return extractStringValue(type.type, span);
            } else {
              return type.type.value;
            }
          case "ModelProperty":
            return extractStringValue(type.type, span);
          case "EnumMember":
            if (type.value === undefined) return type.name;
            if (typeof type.value === "string") return type.value;
            if (typeof type.value === "number") return `${type.value}`;
        }
        reportDiagnostic(emitter.getProgram(), {
          code: "invalid-interpolation",
          target: span,
          format: {},
        });
        return "";
      }
      switch (tsType.kind) {
        case "String":
          return [code`string`, `"${tsType.value}"`, false];
        case "StringTemplate":
          const template = tsType;
          if (template.stringValue !== undefined)
            return [code`string`, `"${template.stringValue}"`, false];
          const spanResults: string[] = [];
          for (const span of template.spans) {
            spanResults.push(extractStringValue(span, span));
          }
          return [code`string`, `"${spanResults.join("")}"`, false];
        case "Boolean":
          return [code`bool`, `${tsType.value === true ? true : false}`, false];
        case "Number":
          const [type, value] = this.#findNumericType(tsType);
          return [code`${type}`, `${value}`, false];
        case "Tuple":
          const defaults = [];
          const [csharpType, isObject] = this.#coalesceTypes(tsType.values);
          if (isObject) return ["object[]", undefined, false];
          for (const value of tsType.values) {
            const [_, itemDefault] = this.#getTypeInfoForTsType(value);
            defaults.push(itemDefault);
          }
          return [
            code`${csharpType.getTypeReference()}[]`,
            `[${defaults.join(", ")}]`,
            csharpType.isNullable,
          ];
        case "Object":
          return [code`object`, undefined, false];
        case "Model":
          if (this.#isRecord(tsType)) {
            return [code`JsonObject`, undefined, false];
          }
          return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
        case "ModelProperty":
          return this.#getTypeInfoForTsType(tsType.type);
        case "Enum":
          return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
        case "EnumMember":
          if (typeof tsType.value === "number") {
            const stringValue = tsType.value.toString();
            if (stringValue.includes(".") || stringValue.includes("e"))
              return ["double", stringValue, false];
            return ["int", stringValue, false];
          }
          if (typeof tsType.value === "string") {
            return ["string", tsType.value, false];
          }
          return [code`object`, undefined, false];
        case "Union":
          return this.#getTypeInfoForUnion(tsType);
        case "UnionVariant":
          return this.#getTypeInfoForTsType(tsType.type);
        default:
          return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
      }
    }

    #findNumericType(type: NumericLiteral): [string, string] {
      const stringValue = type.valueAsString;
      if (stringValue.includes(".") || stringValue.includes("e")) return ["double", stringValue];
      return ["int", stringValue];
    }
    modelPropertyReference(property: ModelProperty): EmitterOutput<string> {
      return code`${this.emitter.emitTypeReference(property.type)}`;
    }

    numericLiteral(number: NumericLiteral): EmitterOutput<string> {
      return this.emitter.result.rawCode(code`${number.value.toString()}`);
    }

    interfaceDeclaration(iface: Interface, name: string): EmitterOutput<string> {
      // interface declaration
      const ifaceName = `I${ensureCSharpIdentifier(
        this.emitter.getProgram(),
        iface,
        name,
        NameCasingType.Class,
      )}`;
      const namespace = this.emitter.getContext().namespace;
      const doc = getDoc(this.emitter.getProgram(), iface);
      const attributes = getModelAttributes(this.emitter.getProgram(), iface, ifaceName);
      this.#metadateMap.set(iface, new CSharpType({ name: ifaceName, namespace: namespace }));
      const decl = this.emitter.result.declaration(
        ifaceName,
        code`${this.#generatedFileHeaderWithNullable}

      ${this.#emitUsings()}

      namespace ${namespace} {

      ${doc ? `${formatComment(doc)}\n` : ""}${`${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}${attributes?.length > 0 ? "\n" : ""}`}public interface ${ifaceName} {
      ${this.emitter.emitInterfaceOperations(iface)}
    }
   } `,
      );

      return decl;
    }

    interfaceDeclarationContext(iface: Interface, name: string): Context {
      // set up interfaces file for declaration
      const ifaceName: string = `I${ensureCSharpIdentifier(this.emitter.getProgram(), iface, name, NameCasingType.Class)}`;
      const sourceFile = this.emitter.createSourceFile(`operations/${ifaceName}.cs`);
      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Interface;
      const ifaceNamespace = this.#getOrSetBaseNamespace(iface);
      const modelNamespace = `${ifaceNamespace}.Models`;
      const context = this.#createModelContext(ifaceNamespace, sourceFile, ifaceName);
      context.file.imports.set("System", ["System"]);
      context.file.imports.set("System.Net", ["System.Net"]);
      context.file.imports.set("System.Text.Json", ["System.Text.Json"]);
      context.file.imports.set("System.Text.Json.Serialization", [
        "System.Text.Json.Serialization",
      ]);
      context.file.imports.set("System.Threading.Tasks", ["System.Threading.Tasks"]);
      context.file.imports.set("Microsoft.AspNetCore.Mvc", ["Microsoft.AspNetCore.Mvc"]);
      if (this.#hasMultipartOperation(iface)) {
        context.file.imports.set("Microsoft.AspNetCore.WebUtilities", [
          "Microsoft.AspNetCore.WebUtilities",
        ]);
      }
      context.file.imports.set(modelNamespace, [modelNamespace]);
      return context;
    }

    interfaceDeclarationOperations(iface: Interface): EmitterOutput<string> {
      // add in operations
      const builder: StringBuilder = new StringBuilder();
      const metadata = new HttpMetadata();
      const context = this.emitter.getContext();
      const name = `${ensureCSharpIdentifier(
        this.emitter.getProgram(),
        iface,
        iface.name,
        NameCasingType.Class,
      )}`;
      const ifaceNamespace = this.#getOrSetBaseNamespace(iface);
      const namespace = `${ifaceNamespace}`;
      const mock: BusinessLogicImplementation = {
        className: name,
        interfaceName: `I${name}`,
        methods: [],
        namespace: namespace,
        usings: [`${ifaceNamespace}.Models`],
      };
      for (const [name, operation] of iface.operations) {
        const doc = getDoc(this.emitter.getProgram(), operation);
        const returnTypes: Type[] = [];
        const [httpOp, _] = getHttpOperation(this.emitter.getProgram(), operation);
        for (const response of httpOp.responses.filter(
          (r) => !isErrorModel(this.emitter.getProgram(), r.type),
        )) {
          returnTypes.push(
            metadata.resolveLogicalResponseType(this.emitter.getProgram(), response),
          );
        }
        const returnInfo = coalesceTypes(this.emitter.getProgram(), returnTypes, context.namespace);
        const returnType: CSharpType = returnInfo?.type || UnknownType;
        const opName = ensureCSharpIdentifier(
          this.emitter.getProgram(),
          operation,
          name,
          NameCasingType.Method,
        );
        let opDecl: Declaration<string>;
        let opImpl: BusinessLogicMethod;
        if (this.#isMultipartRequest(httpOp)) {
          opImpl = {
            methodName: `${opName}Async`,
            methodParams: `${this.#emitInterfaceOperationParameters(operation, "MultipartReader reader")}`,
            returnType: `${returnType.name === "void" ? "Task" : `Task<${returnType.getTypeReference(context.scope)}>`}`,
            instantiatedReturnType:
              returnType.name === "void"
                ? undefined
                : `${returnType.getTypeReference(context.scope)}`,
          };
          opDecl = this.emitter.result.declaration(
            opName,
            code`${doc ? `${formatComment(doc)}\n` : ""}${opImpl.returnType} ${opImpl.methodName}( ${opImpl.methodParams});`,
          );
        } else {
          opImpl = {
            methodName: `${opName}Async`,
            methodParams: `${this.#emitInterfaceOperationParameters(operation)}`,
            returnType: `${returnType.name === "void" ? "Task" : `Task<${returnType.getTypeReference(context.scope)}>`}`,
            instantiatedReturnType:
              returnType.name === "void"
                ? undefined
                : `${returnType.getTypeReference(context.scope)}`,
          };
          opDecl = this.emitter.result.declaration(
            opName,
            code`${doc ? `${formatComment(doc)}\n` : ""}${opImpl.returnType} ${opImpl.methodName}( ${opImpl.methodParams});`,
          );
        }
        mock.methods.push(opImpl);
        builder.push(code`${opDecl.value}\n`);
        this.emitter.emitInterfaceOperation(operation);
      }
      this.#mockRegistrations.set(mock.interfaceName, mock);
      return builder.reduce();
    }

    interfaceOperationDeclarationContext(operation: Operation): Context {
      const resource = getResourceOperation(this.emitter.getProgram(), operation);
      const controllerName: string =
        operation.interface !== undefined
          ? operation.interface.name
          : resource === undefined
            ? NoResourceContext
            : resource.resourceType.name;
      return this.#createOrGetResourceContext(controllerName, operation, resource?.resourceType);
    }

    interfaceOperationDeclaration(operation: Operation, name: string): EmitterOutput<string> {
      const operationName = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        operation,
        name,
        NameCasingType.Method,
      );

      const doc = getDoc(this.emitter.getProgram(), operation);
      const [httpOperation, _] = getHttpOperation(this.emitter.getProgram(), operation);
      const multipart: boolean = this.#isMultipartRequest(httpOperation);
      const declParams = !multipart
        ? this.#emitHttpOperationParameters(httpOperation)
        : this.#emitHttpOperationParameters(httpOperation, true);

      if (multipart) {
        const context = this.emitter.getContext();
        context.file.imports.set("Microsoft.AspNetCore.WebUtilities", [
          "Microsoft.AspNetCore.WebUtilities",
        ]);
        context.file.imports.set("Microsoft.AspNetCore.Http.Extensions", [
          "Microsoft.AspNetCore.Http.Extensions",
        ]);
      }
      const responseInfo = this.#getOperationResponse(httpOperation);
      const status = responseInfo?.statusCode ?? 200;
      const response: CSharpType =
        responseInfo?.resultType ??
        new CSharpType({
          name: "void",
          namespace: "System",
          isBuiltIn: true,
          isValueType: false,
        });

      const hasResponseValue = response.name !== "void";
      const resultString = `${status === 204 ? "NoContent" : "Ok"}`;
      if (!this.#isMultipartRequest(httpOperation)) {
        return this.emitter.result.declaration(
          operation.name,
          code`
        ${doc ? `${formatComment(doc)}` : ""}
        [${getOperationVerbDecorator(httpOperation)}]
        [Route("${httpOperation.path}")]
        ${this.emitter.emitOperationReturnType(operation)}
        public virtual async Task<IActionResult> ${operationName}(${declParams})
        {
          ${
            hasResponseValue
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(
                  httpOperation,
                )});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(
                  httpOperation,
                )});
          return ${resultString}();`
          }
        }`,
        );
      } else {
        return this.emitter.result.declaration(
          operation.name,
          code`
        ${doc ? `${formatComment(doc)}` : ""}
        [${getOperationVerbDecorator(httpOperation)}]
        [Route("${httpOperation.path}")]
        [Consumes("multipart/form-data")]
        ${this.emitter.emitOperationReturnType(operation)}
        public virtual async Task<IActionResult> ${operationName}(${declParams})
        {
          var boundary = Request.GetMultipartBoundary();
          if (boundary == null)
          {
             return BadRequest("Request missing multipart boundary");
          }


          var reader = new MultipartReader(boundary, Request.Body);
          ${
            hasResponseValue
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(httpOperation, "reader")});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(httpOperation, "reader")});
          return ${resultString}();`
          }
        }`,
        );
      }
    }

    operationDeclarationContext(operation: Operation, name: string): Context {
      const resource = getResourceOperation(this.emitter.getProgram(), operation);
      const controllerName: string =
        (operation.interface?.name ?? resource === undefined)
          ? NoResourceContext
          : resource.resourceType.name;
      return this.#createOrGetResourceContext(controllerName, operation, resource?.resourceType);
    }

    operationDeclaration(operation: Operation, name: string): EmitterOutput<string> {
      const operationName = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        operation,
        name,
        NameCasingType.Method,
      );
      const doc = getDoc(this.emitter.getProgram(), operation);
      const [httpOperation, _] = getHttpOperation(this.emitter.getProgram(), operation);
      const declParams = this.#emitHttpOperationParameters(httpOperation);
      const responseInfo = this.#getOperationResponse(httpOperation);
      const status = responseInfo?.statusCode ?? 200;
      const response: CSharpType =
        responseInfo?.resultType ??
        new CSharpType({
          name: "void",
          namespace: "System",
          isBuiltIn: true,
          isValueType: false,
        });

      const hasResponseValue = response.name !== "void";
      const resultString = `${status === 204 ? "NoContent" : "Ok"}`;
      return this.emitter.result.declaration(
        operation.name,
        code`
        ${doc ? `${formatComment(doc)}` : ""}
        [${getOperationVerbDecorator(httpOperation)}]
        [Route("${httpOperation.path}")]
        ${this.emitter.emitOperationReturnType(operation)}
        public virtual async Task<IActionResult> ${operationName}(${declParams})
        {
          ${
            hasResponseValue
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(
                  httpOperation,
                )});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${this.#emitOperationCallParameters(
                  httpOperation,
                )});
          return ${resultString}();`
          }
        }`,
      );
    }
    operationReturnType(operation: Operation, returnType: Type): EmitterOutput<string> {
      const [httpOperation, _] = getHttpOperation(this.emitter.getProgram(), operation);
      return this.#emitOperationResponses(httpOperation);
    }

    stringTemplate(stringTemplate: StringTemplate): EmitterOutput<string> {
      return this.emitter.result.rawCode(stringTemplate.stringValue || "");
    }

    #getOperationResponse(operation: HttpOperation): ResponseInfo | undefined {
      const validResponses = operation.responses.filter(
        (r) =>
          !isErrorModel(this.emitter.getProgram(), r.type) &&
          getCSharpStatusCode(r.statusCodes) !== undefined,
      );
      if (validResponses.length < 1) return undefined;
      const response = validResponses[0];
      const csharpStatusCode = getCSharpStatusCode(response.statusCodes);
      if (csharpStatusCode === undefined) return undefined;
      const responseType = new HttpMetadata().resolveLogicalResponseType(
        this.emitter.getProgram(),
        response,
      );
      const context = this.emitter.getContext();
      const result = getCSharpType(this.emitter.getProgram(), responseType, context.namespace);
      const resultType = result?.type || UnknownType;
      return {
        csharpStatusCode,
        resultType,
        statusCode: response.statusCodes,
      };
    }
    #emitOperationResponses(operation: HttpOperation): EmitterOutput<string> {
      const builder: StringBuilder = new StringBuilder();
      let i = 0;
      const validResponses = operation.responses.filter(
        (r) =>
          !isErrorModel(this.emitter.getProgram(), r.type) &&
          getCSharpStatusCode(r.statusCodes) !== undefined,
      );
      for (const response of validResponses) {
        i++;
        builder.push(code`${this.#emitOperationResponseDecorator(response)}`);
        if (i < validResponses.length) {
          builder.pushLiteralSegment("\n");
        }
      }

      for (const response of operation.responses) {
        if (!isEmptyResponseModel(this.emitter.getProgram(), response.type))
          this.emitter.emitType(response.type);
      }

      return builder.reduce();
    }

    #emitOperationResponseDecorator(response: HttpOperationResponse) {
      const responseType = new HttpMetadata().resolveLogicalResponseType(
        this.emitter.getProgram(),
        response,
      );
      return this.emitter.result.rawCode(
        code`[ProducesResponseType((int)${getCSharpStatusCode(
          response.statusCodes,
        )!}, Type = typeof(${this.#emitResponseType(responseType)}))]`,
      );
    }

    #emitResponseType(type: Type) {
      const context = this.emitter.getContext();
      const result = getCSharpType(this.emitter.getProgram(), type, context.namespace);
      const resultType = result?.type || UnknownType;
      return resultType.getTypeReference(context.scope);
    }

    #emitInterfaceOperationParameters(
      operation: Operation,
      bodyParam?: string,
    ): EmitterOutput<string> {
      const signature = new StringBuilder();
      const requiredParams: ModelProperty[] = [];
      const optionalParams: ModelProperty[] = [];
      let totalParams = 0;
      if (bodyParam !== undefined) totalParams++;
      const validParams = [...operation.parameters.properties.entries()].filter(([_, p]) =>
        isValidParameter(this.emitter.getProgram(), p),
      );
      for (const [_, parameter] of validParams) {
        if (
          !isContentTypeHeader(this.emitter.getProgram(), parameter) &&
          (bodyParam === undefined || isHttpMetadata(this.emitter.getProgram(), parameter))
        ) {
          if (parameter.optional || parameter.defaultValue) optionalParams.push(parameter);
          else requiredParams.push(parameter);
          totalParams++;
        }
      }
      let i = 1;
      for (const requiredParam of requiredParams) {
        const [paramType, _, __] = this.#findPropertyType(requiredParam);
        signature.push(
          code`${paramType} ${ensureCSharpIdentifier(this.emitter.getProgram(), requiredParam, requiredParam.name, NameCasingType.Parameter)}${i++ < totalParams ? ", " : ""}`,
        );
      }
      if (bodyParam) {
        signature.push(bodyParam);
        if (i++ < totalParams) signature.push(", ");
      }
      for (const optionalParam of optionalParams) {
        const [paramType, _, __] = this.#findPropertyType(optionalParam);
        signature.push(
          code`${paramType}? ${ensureCSharpIdentifier(this.emitter.getProgram(), optionalParam, optionalParam.name, NameCasingType.Parameter)}${i++ < totalParams ? ", " : ""}`,
        );
      }

      return signature.reduce();
    }

    #emitHttpOperationParameters(
      operation: HttpOperation,
      bodyParameter?: boolean,
    ): EmitterOutput<string> {
      const signature = new StringBuilder();
      const bodyParam = operation.parameters.body;
      let i = 0;
      //const pathParameters = operation.parameters.parameters.filter((p) => p.type === "path");
      const validParams: HttpOperationParameter[] = operation.parameters.parameters.filter((p) =>
        isValidParameter(this.emitter.getProgram(), p.param),
      );
      const requiredParams: HttpOperationParameter[] = validParams.filter(
        (p) => p.type === "path" || (!p.param.optional && p.param.defaultValue === undefined),
      );
      const optionalParams: HttpOperationParameter[] = validParams.filter(
        (p) => p.type !== "path" && (p.param.optional || p.param.defaultValue !== undefined),
      );
      for (const parameter of requiredParams) {
        signature.push(
          code`${this.#emitOperationSignatureParameter(operation, parameter)}${
            ++i < requiredParams.length ? ", " : ""
          }`,
        );
      }
      if (
        requiredParams.length > 0 &&
        (optionalParams.length > 0 || (bodyParameter === undefined && bodyParam !== undefined))
      ) {
        signature.push(code`, `);
      }
      if (bodyParameter === undefined) {
        if (bodyParam !== undefined) {
          signature.push(
            code`${this.emitter.emitTypeReference(
              this.#metaInfo.getEffectivePayloadType(
                bodyParam.type,
                Visibility.Create || Visibility.Update,
              ),
            )} body${requiredParams.length > 0 && optionalParams.length > 0 ? ", " : ""}`,
          );
        }
      }
      i = 0;
      for (const parameter of optionalParams) {
        signature.push(
          code`${this.#emitOperationSignatureParameter(operation, parameter)}${
            ++i < optionalParams.length ? ", " : ""
          }`,
        );
      }

      return signature.reduce();
    }

    unionDeclaration(union: Union, name: string): EmitterOutput<string> {
      const baseType = this.#coalesceUnionTypes(union);
      if (baseType.isBuiltIn && baseType.name === "string") {
        const program = this.emitter.getProgram();
        const unionName = ensureCSharpIdentifier(program, union, name);
        const namespace = this.emitter.getContext().namespace;
        const doc = getDoc(this.emitter.getProgram(), union);
        const attributes = getModelAttributes(program, union, unionName);
        this.#metadateMap.set(union, new CSharpType({ name: unionName, namespace: namespace }));
        return this.emitter.result.declaration(
          unionName,
          code`${this.#generatedFileHeader}
        
        ${this.#emitUsings()}
        
        namespace ${namespace}
        {

            ${doc ? `${formatComment(doc)}` : ""}
            ${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}
            public enum ${unionName}
            {
              ${this.emitter.emitUnionVariants(union)};
            }
        } `,
        );
      }

      return this.emitter.result.rawCode(code`${baseType.getTypeReference()}`);
    }

    unionDeclarationContext(union: Union): Context {
      const baseType = this.#coalesceUnionTypes(union);
      if (baseType.isBuiltIn && baseType.name === "string") {
        const unionName = ensureCSharpIdentifier(
          this.emitter.getProgram(),
          union,
          union.name || "Union",
        );
        const unionFile = this.emitter.createSourceFile(`models/${unionName}.cs`);
        unionFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
        const unionNamespace = `${this.#getOrSetBaseNamespace(union)}.Models`;
        return {
          namespace: unionNamespace,
          file: unionFile,
          scope: unionFile.globalScope,
        };
      } else {
        return this.emitter.getContext();
      }
    }

    unionInstantiation(union: Union, name: string): EmitterOutput<string> {
      return super.unionInstantiation(union, name);
    }

    unionInstantiationContext(union: Union, name: string): Context {
      return super.unionInstantiationContext(union, name);
    }

    unionVariants(union: Union): EmitterOutput<string> {
      const result = new StringBuilder();
      let i = 0;
      for (const [name, variant] of union.variants) {
        i++;
        if (variant.type.kind === "String") {
          const nameHint: string = (name as string) || variant.type.value;
          const memberName: string = ensureCSharpIdentifier(
            this.emitter.getProgram(),
            variant,
            nameHint,
          );
          this.#metadateMap.set(variant, { name: memberName });
          result.push(
            code`${ensureCSharpIdentifier(this.emitter.getProgram(), variant, nameHint)} = "${variant.type.value}"`,
          );
          if (i < union.variants.size) result.pushLiteralSegment(", ");
        }
      }

      return this.emitter.result.rawCode(result.reduce());
    }

    unionVariantContext(union: Union): Context {
      return super.unionVariantContext(union);
    }

    #emitOperationSignatureParameter(
      operation: HttpOperation,
      httpParam: HttpOperationParameter,
    ): EmitterOutput<string> {
      const name = httpParam.param.name;
      const parameter = httpParam.param;
      const emittedName = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        parameter,
        name,
        NameCasingType.Parameter,
      );
      let [emittedType, emittedDefault, _] = this.#findPropertyType(parameter);
      if (emittedType.toString().endsWith("[]")) emittedDefault = undefined;
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const defaultValue = parameter.default
        ? // eslint-disable-next-line @typescript-eslint/no-deprecated
          code`${this.emitter.emitType(parameter.default)}`
        : emittedDefault;
      return this.emitter.result.rawCode(
        code`${httpParam.type !== "path" ? this.#emitParameterAttribute(httpParam) : ""}${emittedType} ${emittedName}${defaultValue === undefined ? "" : ` = ${defaultValue}`}`,
      );
    }
    #getBodyParameters(operation: HttpOperation): ModelProperty[] | undefined {
      const bodyParam = operation.parameters.body;
      if (bodyParam === undefined) return undefined;
      if (bodyParam.property !== undefined) return [bodyParam.property];
      if (bodyParam.type.kind !== "Model" || bodyParam.type.properties.size < 1) return undefined;
      return [...bodyParam.type.properties.values()];
    }

    #emitOperationCallParameters(
      operation: HttpOperation,
      bodyParameter: string = "body",
    ): EmitterOutput<string> {
      const signature = new StringBuilder();
      let i = 0;
      const bodyParameters = this.#getBodyParameters(operation);
      //const pathParameters = operation.parameters.parameters.filter((p) => p.type === "path");
      const valid = operation.parameters.parameters.filter((p) =>
        isValidParameter(this.emitter.getProgram(), p.param),
      );
      const required: HttpOperationParameter[] = valid.filter(
        (p) => p.type === "path" || (!p.param.optional && p.param.defaultValue === undefined),
      );
      const optional: HttpOperationParameter[] = valid.filter(
        (p) => p.type !== "path" && (p.param.optional || p.param.defaultValue !== undefined),
      );
      for (const parameter of required) {
        const contentType: boolean = isContentTypeHeader(
          this.emitter.getProgram(),
          parameter.param,
        );
        i++;
        if (
          !isNeverType(parameter.param.type) &&
          !isNullType(parameter.param.type) &&
          !isVoidType(parameter.param.type) &&
          !contentType
        ) {
          signature.push(
            code`${this.#emitOperationCallParameter(operation, parameter)}${
              i < valid.length || bodyParameters !== undefined ? ", " : ""
            }`,
          );
        }
      }
      if (bodyParameters !== undefined) {
        if (bodyParameters.length === 1) {
          signature.push(code`${bodyParameter}`);
        } else {
          let j = 0;
          for (const parameter of bodyParameters) {
            j++;
            const propertyName = ensureCSharpIdentifier(
              this.emitter.getProgram(),
              parameter,
              parameter.name,
              NameCasingType.Property,
            );
            signature.push(
              code`${bodyParameter}?.${propertyName}${j < bodyParameters.length || i < valid.length ? ", " : ""}`,
            );
          }
        }
      }

      for (const parameter of optional) {
        const contentType: boolean = isContentTypeHeader(
          this.emitter.getProgram(),
          parameter.param,
        );
        i++;
        if (
          !isNeverType(parameter.param.type) &&
          !isNullType(parameter.param.type) &&
          !isVoidType(parameter.param.type) &&
          !contentType
        ) {
          signature.push(
            code`${this.#emitOperationCallParameter(operation, parameter)}${
              i < valid.length ? ", " : ""
            }`,
          );
        }
      }
      return signature.reduce();
    }
    #emitOperationCallParameter(
      operation: HttpOperation,
      httpParam: HttpOperationParameter,
    ): EmitterOutput<string> {
      const name = httpParam.param.name;
      const parameter = httpParam.param;
      const emittedName = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        parameter,
        name,
        NameCasingType.Parameter,
      );
      return this.emitter.result.rawCode(code`${emittedName}`);
    }

    #emitParameterAttribute(parameter: HttpOperationParameter): EmitterOutput<string> {
      switch (parameter.type) {
        case "header":
          return code`[FromHeader(Name="${parameter.name}")] `;
        case "query":
          return code`[FromQuery(Name="${parameter.name}")] `;
        default:
          return "";
      }
    }

    #createModelContext(namespace: string, file: SourceFile<string>, name: string): Context {
      const context = {
        namespace: namespace,
        name: name,
        file: file,
        scope: file.globalScope,
      };
      context.file.imports.set("System", ["System"]);
      context.file.imports.set("System.Text.Json", ["System.Text.Json"]);
      context.file.imports.set("System.Text.Json.Serialization", [
        "System.Text.Json.Serialization",
      ]);
      return context;
    }

    #createOrGetResourceContext(
      name: string,
      operation: Operation,
      resource?: Model,
    ): ControllerContext {
      let context: ControllerContext | undefined = controllers.get(name);
      if (context !== undefined) return context;
      const sourceFile: SourceFile<string> = this.emitter.createSourceFile(
        `controllers/${name}Controller.cs`,
      );
      const namespace = this.#getOrSetBaseNamespace(operation);
      const modelNamespace = `${namespace}.Models`;
      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Controller;
      sourceFile.meta["resourceName"] = name;
      sourceFile.meta["resource"] = `${name}Controller`;
      sourceFile.meta["namespace"] = namespace;
      context = {
        namespace: sourceFile.meta["namespace"],
        file: sourceFile,
        resourceName: name,
        scope: sourceFile.globalScope,
        resourceType: resource,
      };
      context.file.imports.set("System", ["System"]);
      context.file.imports.set("System.Net", ["System.Net"]);
      context.file.imports.set("System.Threading.Tasks", ["System.Threading.Tasks"]);
      context.file.imports.set("System.Text.Json", ["System.Text.Json"]);
      context.file.imports.set("System.Text.Json.Serialization", [
        "System.Text.Json.Serialization",
      ]);
      context.file.imports.set("Microsoft.AspNetCore.Mvc", ["Microsoft.AspNetCore.Mvc"]);
      context.file.imports.set(modelNamespace, [modelNamespace]);
      context.file.imports.set(namespace, [namespace]);
      controllers.set(name, context);
      return context;
    }

    // eslint-disable-next-line no-unused-private-class-members
    #getNamespaceFullName(namespace: Namespace | undefined): string {
      return namespace
        ? ensureCSharpIdentifier(
            this.emitter.getProgram(),
            namespace,
            getNamespaceFullName(namespace),
          )
        : "TypeSpec";
    }
    reference(
      targetDeclaration: Declaration<string>,
      pathUp: Scope<string>[],
      pathDown: Scope<string>[],
      commonScope: Scope<string> | null,
    ): string | EmitEntity<string> {
      //if (targetDeclaration.name) return targetDeclaration.name;
      return super.reference(targetDeclaration, pathUp, pathDown, commonScope);
    }

    scalarInstantiation(scalar: Scalar, name: string | undefined): EmitterOutput<string> {
      const scalarType = getCSharpTypeForScalar(this.emitter.getProgram(), scalar);
      return scalarType.getTypeReference(this.emitter.getContext().scope);
    }

    scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<string> {
      const scalarType = getCSharpTypeForScalar(this.emitter.getProgram(), scalar);
      return scalarType.getTypeReference(this.emitter.getContext().scope);
    }

    sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
      for (const libFile of this.#libraryFiles) {
        if (sourceFile === libFile.source) return libFile.emitted;
      }
      if (this.#emitMocks === "all") {
        for (const helper of this.#mockHelpers) {
          if (sourceFile === helper.source) return helper.emitted;
        }
      }
      if (this.#mockFiles.length > 0) {
        for (const mock of this.#mockFiles) {
          if (sourceFile === mock.source) return mock.emitted;
        }
      }

      const emittedSourceFile: EmittedSourceFile = {
        path: sourceFile.path,
        contents: "",
      };

      switch (sourceFile.meta[this.#sourceTypeKey]) {
        case CSharpSourceType.Controller:
          emittedSourceFile.contents = this.#emitControllerContents(sourceFile);
          break;
        default:
          emittedSourceFile.contents = this.#emitCodeContents(sourceFile);
          break;
      }

      return emittedSourceFile;
    }

    #emitCodeContents(file: SourceFile<string>): string {
      const contents: StringBuilder = new StringBuilder();
      for (const decl of file.globalScope.declarations) {
        contents.push(decl.value);
      }

      return contents.segments.join("\n") + "\n";
    }

    #emitControllerContents(file: SourceFile<string>): string {
      const namespace = file.meta.namespace;
      const contents: StringBuilder = new StringBuilder();
      contents.push(`${this.#generatedFileHeader}\n\n`);
      contents.push(code`${this.#emitUsings(file)}\n`);
      contents.push("\n");
      contents.push(`namespace ${namespace}.Controllers\n`);
      contents.push("{\n");
      contents.push("[ApiController]\n");
      contents.push(`public partial class ${file.meta["resource"]}: ControllerBase\n`);
      contents.push("{\n");
      contents.push("\n");
      contents.push(`public ${file.meta["resource"]}(I${file.meta.resourceName} operations)\n`);
      contents.push("{\n");
      contents.push(`    ${file.meta.resourceName}Impl = operations;\n`);
      contents.push("}");
      contents.push("\n");
      contents.push(
        code`internal virtual I${file.meta.resourceName} ${file.meta.resourceName}Impl { get;}\n`,
      );
      for (const decl of file.globalScope.declarations) {
        contents.push(decl.value + "\n");
      }
      contents.push("\n}");
      contents.push("\n}");

      return contents.segments.join("\n") + "\n";
    }

    stringLiteral(string: StringLiteral): EmitterOutput<string> {
      return this.emitter.result.rawCode(code`"${string.value}"`);
    }

    tupleLiteral(tuple: Tuple): EmitterOutput<string> {
      return this.emitter.result.rawCode(code`{
        ${this.emitter.emitTupleLiteralValues(tuple)}
      }`);
    }

    tupleLiteralValues(tuple: Tuple): EmitterOutput<string> {
      const result = new StringBuilder();
      for (const tupleValue of tuple.values) {
        result.push(code`${this.emitter.emitType(tupleValue)}`);
      }
      return this.emitter.result.rawCode(result.segments.join(",\n"));
    }

    createModelScope(baseScope: Scope<string>, namespace: string): Scope<string> {
      let current: Scope<string> = baseScope;
      for (const part of namespace.split(".")) {
        current = this.emitter.createScope({}, getCSharpIdentifier(part), current);
      }
      return current;
    }

    // TODO: remove?
    // eslint-disable-next-line no-unused-private-class-members
    #getTemplateParameters(model: Model): EmitterOutput<string> {
      if (!model.templateMapper) return "";
      let i = 0;
      const params = new StringBuilder();
      const args: Type[] = model.templateMapper.args
        .flatMap((parm) => parm as Type)
        .filter((arg) => arg !== null && isKnownReferenceType(this.emitter.getProgram(), arg));
      for (const parameter of args) {
        i++;
        params.push(code`${this.emitter.emitTypeReference(parameter)}`);
        if (i < args.length) {
          params.pushLiteralSegment(",");
        }
      }
      if (params.segments.length > 0) return params.reduce();
      return "";
    }

    #coalesceUnionTypes(union: Union): CSharpType {
      const [result, _] = this.#coalesceTypes([...union.variants.values()].flatMap((v) => v.type));
      return result;
    }

    #getNonNullableTsType(union: Union): { type: Type; nullable: boolean } | undefined {
      const types = [...union.variants.values()];
      const nulls = types.flatMap((v) => v.type).filter((t) => isNullType(t));
      const nonNulls = types.flatMap((v) => v.type).filter((t) => !isNullType(t));
      if (nonNulls.length === 1) return { type: nonNulls[0], nullable: nulls.length > 0 };
      return undefined;
    }

    #coalesceTypes(types: Type[]): [CSharpType, boolean] {
      const defaultValue: [CSharpType, boolean] = [
        new CSharpType({
          name: "object",
          namespace: "System",
          isValueType: false,
        }),
        true,
      ];
      let current: CSharpType | undefined = undefined;
      let nullable: boolean = false;
      for (const type of types) {
        let candidate: CSharpType | undefined = undefined;
        switch (type.kind) {
          case "Boolean":
            candidate = new CSharpType({ name: "bool", namespace: "System", isValueType: true });
            break;
          case "StringTemplate":
          case "String":
            candidate = new CSharpType({ name: "string", namespace: "System", isValueType: false });
            break;
          case "Number":
            const stringValue = type.valueAsString;
            if (stringValue.includes(".") || stringValue.includes("e")) {
              candidate = new CSharpType({
                name: "double",
                namespace: "System",
                isValueType: true,
              });
            } else {
              candidate = new CSharpType({ name: "int", namespace: "System", isValueType: true });
            }
            break;
          case "Union":
            candidate = this.#coalesceUnionTypes(type);
            break;
          case "Scalar":
            candidate = getCSharpTypeForScalar(this.emitter.getProgram(), type);
            break;
          case "Intrinsic":
            if (isNullType(type)) {
              nullable = true;
              candidate = current;
            } else {
              return defaultValue;
            }
            break;
          default:
            return defaultValue;
        }

        current = current ?? candidate;
        if (current === undefined || (candidate !== undefined && !candidate.equals(current)))
          return defaultValue;
      }

      if (current !== undefined && nullable) current.isNullable = true;
      return current === undefined ? defaultValue : [current, false];
    }

    writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
      for (const source of this.#libraryFiles) {
        sourceFiles.push(source.source);
      }

      if (this.#emitMocks === "all") {
        for (const helper of this.#mockHelpers) {
          sourceFiles.push(helper.source);
        }

        if (this.#mockRegistrations.size > 0) {
          const mocks = getBusinessLogicImplementations(this.emitter, this.#mockRegistrations);
          this.#mockFiles.push(...mocks);
          sourceFiles.push(...mocks.flatMap((l) => l.source));
        }
      }

      const emittedSourceFiles: SourceFile<string>[] = [];
      for (const source of sourceFiles) {
        switch (this.#emitterOutputType) {
          case "models":
            {
              switch (source.meta[this.#sourceTypeKey]) {
                case CSharpSourceType.Controller:
                  // do nothing
                  break;
                default:
                  emittedSourceFiles.push(source);
                  break;
              }
            }
            break;
          default:
            emittedSourceFiles.push(source);
            break;
        }
      }
      return super.writeOutput(emittedSourceFiles);
    }

    #getOrSetBaseNamespace(type: Type & { namespace?: Namespace }): string {
      if (this.#baseNamespace === undefined) {
        if (type.namespace !== undefined) {
          this.#baseNamespace = `${
            type.namespace
              ? ensureCSharpIdentifier(
                  this.emitter.getProgram(),
                  type.namespace,
                  getNamespaceFullName(type.namespace),
                )
              : "TypeSpec"
          }.Service`;
        } else {
          this.#baseNamespace = "TypeSpec.Service";
        }
      }
      return this.#baseNamespace;
    }
  }

  function isEmptyResponseModel(program: Program, model: Type): boolean {
    if (model.kind !== "Model") return false;
    return model.properties.size === 1 && isStatusCode(program, [...model.properties.values()][0]);
  }

  function isContentTypeHeader(program: Program, parameter: ModelProperty): boolean {
    return (
      isHeader(program, parameter) &&
      (parameter.name === "contentType" ||
        getHeaderFieldName(program, parameter) === "Content-type")
    );
  }

  function isValidParameter(program: Program, parameter: ModelProperty): boolean {
    return (
      !isContentTypeHeader(program, parameter) &&
      (parameter.type.kind !== "Intrinsic" || parameter.type.name !== "never")
    );
  }

  /** Determine whether the given parameter is http metadata */
  function isHttpMetadata(program: Program, property: ModelProperty) {
    return (
      isPathParam(program, property) ||
      isHeader(program, property) ||
      isQueryParam(program, property)
    );
  }
  function processNameSpace(program: Program, target: Namespace, service?: Service | undefined) {
    if (!service) service = getService(program, target);
    if (service) {
      for (const [_, model] of target.models) {
        if (!isTemplateDeclaration(model) && !isEmptyResponseModel(program, model)) {
          emitter.emitType(model);
        }
      }
      for (const [_, en] of target.enums) {
        emitter.emitType(en);
      }
      for (const [_, sc] of target.scalars) {
        emitter.emitType(sc);
      }
      for (const [_, iface] of target.interfaces) {
        if (!isTemplateDeclaration(iface)) {
          emitter.emitType(iface);
        }
      }
      if (target.operations.size > 0) {
        // Collect interface operations for a business logic interface and controller
        const nsOps: [string, Operation][] = [];

        for (const [name, op] of target.operations) {
          if (!isTemplateDeclaration(op)) {
            nsOps.push([name, op]);
          }
        }
        const iface: Interface = program.checker.createAndFinishType({
          node: undefined as any,
          sourceInterfaces: [],
          decorators: [],
          operations: createRekeyableMap(nsOps),
          kind: "Interface",
          name: `${target.name}Operations`,
          namespace: target,
          entityKind: "Type",
          isFinished: true,
        });

        try {
          for (const [_, op] of nsOps) {
            op.interface = iface;
          }
          emitter.emitType(iface);
        } finally {
          for (const [_, op] of nsOps) {
            op.interface = undefined;
          }
          target.interfaces.delete(iface.name);
        }
      }

      for (const [_, sub] of target.namespaces) {
        processNameSpace(program, sub, service);
      }
    } else {
      for (const [_, sub] of target.namespaces) {
        processNameSpace(program, sub);
      }
    }
  }

  const emitter = createAssetEmitter<string, CSharpServiceEmitterOptions>(
    context.program,
    CSharpCodeEmitter,
    context,
  );
  const ns = context.program.checker.getGlobalNamespaceType();
  const options = emitter.getOptions();
  processNameSpace(context.program, ns);
  if (!doNotEmit) {
    await ensureCleanDirectory(context.program, options.emitterOutputDir);
    await emitter.writeOutput();
    if (options["skip-format"] === undefined || options["skip-format"] === false) {
      await execFile("dotnet", [
        "format",
        "whitespace",
        emitter.getOptions().emitterOutputDir,
        "--include-generated",
        "--folder",
      ]);
    }
  }
}
