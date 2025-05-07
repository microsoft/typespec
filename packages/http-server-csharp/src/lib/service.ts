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
} from "@typespec/asset-emitter";
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
  Tuple,
  Type,
  Union,
  getDoc,
  getNamespaceFullName,
  getService,
  isErrorModel,
  isNeverType,
  isNullType,
  isNumericType,
  isTemplateDeclaration,
  isVoidType,
  resolvePath,
  serializeValueAsJson,
} from "@typespec/compiler";
import { createRekeyableMap } from "@typespec/compiler/utils";
import {
  HttpOperation,
  HttpOperationResponse,
  getHeaderFieldName,
  getHttpOperation,
  getHttpPart,
  isHeader,
  isStatusCode,
} from "@typespec/http";
import { getUniqueItems } from "@typespec/json-schema";
import { getResourceOperation } from "@typespec/rest";
import { execFile } from "child_process";
import path from "path";
import { getEncodedNameAttribute } from "./attributes.js";
import {
  GeneratedFileHeader,
  GeneratedFileHeaderWithNullable,
  getSerializationSourceFiles,
} from "./boilerplate.js";
import { getProjectDocs } from "./doc.js";
import {
  Attribute,
  CSharpSourceType,
  CSharpType,
  CSharpTypeMetadata,
  CollectionType,
  ControllerContext,
  NameCasingType,
  ResponseInfo,
  checkOrAddNamespaceToScope,
} from "./interfaces.js";
import { CSharpServiceEmitterOptions, CSharpServiceOptions, reportDiagnostic } from "./lib.js";
import { getProjectHelpers } from "./project.js";
import {
  BusinessLogicImplementation,
  BusinessLogicMethod,
  BusinessLogicRegistrations,
  getBusinessLogicImplementations,
  getScaffoldingHelpers,
} from "./scaffolding.js";
import { getEnumType, getRecordType, isKnownReferenceType } from "./type-helpers.js";
import {
  CSharpOperationHelpers,
  EmittedTypeInfo,
  HttpMetadata,
  ModelInfo,
  UnknownType,
  coalesceTypes,
  coalesceUnionTypes,
  ensureCSharpIdentifier,
  ensureCleanDirectory,
  formatComment,
  getBusinessLogicCallParameters,
  getBusinessLogicDeclParameters,
  getCSharpIdentifier,
  getCSharpStatusCode,
  getCSharpType,
  getCSharpTypeForIntrinsic,
  getCSharpTypeForScalar,
  getFreePort,
  getHttpDeclParameters,
  getImports,
  getModelAttributes,
  getModelDeclarationName,
  getModelInstantiationName,
  getOpenApiConfig,
  getOperationVerbDecorator,
  getStatusCode,
  isEmptyResponseModel,
  isRecord,
  isStringEnumType,
  isValueType,
  resolveReferenceFromScopes,
} from "./utils.js";

type FileExists = (path: string) => Promise<boolean>;

export async function $onEmit(context: EmitContext<CSharpServiceEmitterOptions>) {
  let _unionCounter: number = 0;
  const controllers = new Map<string, ControllerContext>();
  const NoResourceContext: string = "RPCOperations";
  const doNotEmit: boolean = context.program.compilerOptions.dryRun || false;
  CSharpServiceOptions.getInstance().initialize(context.options);

  function getFileWriter(program: Program): FileExists {
    return async (path: string) =>
      !!(await program.host.stat(resolvePath(path)).catch((_) => false));
  }
  class CSharpCodeEmitter extends CodeTypeEmitter {
    #metadateMap: Map<Type, CSharpTypeMetadata> = new Map<Type, CSharpTypeMetadata>();
    #generatedFileHeaderWithNullable: string = GeneratedFileHeaderWithNullable;
    #generatedFileHeader: string = GeneratedFileHeader;
    #sourceTypeKey: string = "sourceType";
    #nsKey = "ResolvedNamespace";
    #namespaces: Map<Namespace, string> = new Map<Namespace, string>();
    #emitterOutputType = context.options["output-type"];
    #emitMocks: string | undefined = context.options["emit-mocks"];
    #useSwagger: boolean = context.options["use-swaggerui"] || false;
    #openapiPath: string = context.options["openapi-path"] || "openapi/openapi.yaml";
    #mockRegistrations: BusinessLogicRegistrations = new Map<string, BusinessLogicImplementation>();
    #opHelpers: CSharpOperationHelpers = new CSharpOperationHelpers(this.emitter);
    #fileExists: FileExists = getFileWriter(this.emitter.getProgram());

    #getOrAddNamespaceForType(type: Type): string | undefined {
      const program = this.emitter.getProgram();
      switch (type.kind) {
        case "Boolean":
        case "String":
        case "StringTemplate":
        case "Number":
        case "Scalar":
        case "Intrinsic":
        case "FunctionParameter":
        case "ScalarConstructor":
        case "StringTemplateSpan":
        case "TemplateParameter":
        case "Tuple":
          return undefined;
        case "EnumMember":
          return this.#getOrAddNamespaceForType(type.enum);
        case "ModelProperty":
        case "UnionVariant":
          return this.#getOrAddNamespaceForType(type.type);
        case "Model":
          if (isRecord(type) && type.indexer)
            return this.#getOrAddNamespaceForType(type.indexer.value);
          if (type.indexer !== undefined && isNumericType(program, type.indexer?.key))
            return this.#getOrAddNamespaceForType(type.indexer.value);
          return this.#getOrAddNamespace(type.namespace);
        case "Union":
          if (isStringEnumType(program, type)) return this.#getOrAddNamespace(type.namespace);
          const unionType = this.#coalesceTsUnion(type);
          if (unionType === undefined) return undefined;
          return this.#getOrAddNamespaceForType(unionType);
        default:
          return this.#getOrAddNamespace(type.namespace);
      }
    }
    #coalesceTsUnion(union: Union): Type | undefined {
      let result: Type | undefined = undefined;
      for (const [_, variant] of union.variants) {
        if (!isNullType(variant.type)) {
          if (result !== undefined && result !== variant.type) return undefined;
          result = variant.type;
        }
      }

      return result;
    }
    #getOrAddNamespace(typespecNamespace?: Namespace): string {
      if (!typespecNamespace?.name) return this.#getDefaultNamespace();
      let resolvedNamespace: string | undefined = this.#namespaces.get(typespecNamespace);
      if (resolvedNamespace !== undefined) return resolvedNamespace;
      const nsName = getNamespaceFullName(typespecNamespace);
      resolvedNamespace = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        typespecNamespace,
        nsName,
        NameCasingType.Namespace,
      );
      this.#namespaces.set(typespecNamespace, resolvedNamespace);
      return resolvedNamespace;
    }

    #getDefaultNamespace(): string {
      return "TypeSpec.Service";
    }

    arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<string> {
      return this.collectionDeclaration(elementType, array);
    }

    arrayLiteral(array: Model, elementType: Type): EmitterOutput<string> {
      this.emitter.emitType(elementType, this.emitter.getContext());
      const csType = getCSharpType(
        this.emitter.getProgram(),
        array,
        this.#getOrAddNamespaceForType(elementType),
      );
      if (csType?.type) {
        return code`${csType.type.getTypeReference(this.emitter.getContext()?.scope)}`;
      }

      return this.collectionDeclaration(elementType, array);
    }

    collectionDeclaration(elementType: Type, array: Model): EmitterOutput<string> {
      const isUniqueItems = getUniqueItems(this.emitter.getProgram(), array);
      const collectionType = isUniqueItems
        ? CollectionType.ISet
        : CSharpServiceOptions.getInstance().collectionType;

      switch (collectionType) {
        case CollectionType.ISet:
          return code`ISet<${this.emitter.emitTypeReference(elementType, this.emitter.getContext())}>`;
        case CollectionType.IEnumerable:
          return code`IEnumerable<${this.emitter.emitTypeReference(elementType, this.emitter.getContext())}>`;
        case CollectionType.Array:
        default:
          return code`${this.emitter.emitTypeReference(elementType, this.emitter.getContext())}[]`;
      }
    }

    booleanLiteral(boolean: BooleanLiteral): EmitterOutput<string> {
      return code`${boolean.value === true ? "true" : "false"}`;
    }

    unionLiteral(union: Union): EmitterOutput<string> {
      const csType = coalesceUnionTypes(this.emitter.getProgram(), union);
      return this.emitter.result.rawCode(
        csType ? csType.getTypeReference(this.emitter.getContext()?.scope) : "object",
      );
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
          if (!declarationType.name)
            return getModelDeclarationName(
              this.emitter.getProgram(),
              declarationType,
              `${_unionCounter++}`,
            );
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
      if (getEnumType(en) === "double") return "";
      const program = this.emitter.getProgram();
      const enumName = ensureCSharpIdentifier(program, en, name);
      const namespace = this.emitter.getContext().namespace;
      const doc = getDoc(this.emitter.getProgram(), en);
      const attributes = getModelAttributes(program, en, enumName);
      this.#metadateMap.set(en, new CSharpType({ name: enumName, namespace: namespace }));
      return this.emitter.result.declaration(
        enumName,
        code`
        namespace ${namespace}
        {

            ${doc ? `${formatComment(doc)}` : ""}
            ${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}
            public enum ${enumName}
            {
              ${this.emitter.emitEnumMembers(en)}
            }
        } `,
      );
    }

    enumDeclarationContext(en: Enum): Context {
      if (getEnumType(en) === "double") return this.emitter.getContext();
      const enumName = ensureCSharpIdentifier(this.emitter.getProgram(), en, en.name);
      const enumFile = this.emitter.createSourceFile(`generated/models/${enumName}.cs`);
      enumFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const enumNamespace = this.#getOrAddNamespace(en.namespace);
      return this.#createEnumContext(enumNamespace, enumFile, enumName);
    }

    enumMembers(en: Enum): EmitterOutput<string> {
      const enumType = getEnumType(en);
      const result = new StringBuilder();
      let i = 0;
      for (const [name, member] of en.members) {
        i++;
        const memberName: string = ensureCSharpIdentifier(this.emitter.getProgram(), member, name);
        this.#metadateMap.set(member, { name: memberName });
        if (enumType === "string") {
          result.push(
            code`
          [JsonStringEnumMemberName("${member.value ? (member.value as string) : name}")]
          ${ensureCSharpIdentifier(this.emitter.getProgram(), member, name)}`,
          );
          if (i < en.members.size) result.pushLiteralSegment(",\n");
        } else if (member.value !== undefined) {
          result.push(
            code`
          ${ensureCSharpIdentifier(this.emitter.getProgram(), member, name)} = ${member.value.toString()}`,
          );
          if (i < en.members.size) result.pushLiteralSegment(",\n");
        }
      }

      return this.emitter.result.rawCode(result.reduce());
    }

    intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<string> {
      switch (intrinsic.name) {
        case "unknown":
        case "null":
          return this.emitter.result.rawCode(
            code`${UnknownType.getTypeReference(this.emitter.getContext().scope)}`,
          );
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
          return this.emitter.result.rawCode(
            `${type?.type.getTypeReference(this.emitter.getContext().scope)}`,
          );
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
      const isErrorType = isErrorModel(this.emitter.getProgram(), model);
      if (model.baseModel && model.baseModel.namespace !== model.namespace) {
        const resolvedNs = this.#getOrAddNamespaceForType(model.baseModel);
        if (resolvedNs) checkOrAddNamespaceToScope(resolvedNs, this.emitter.getContext().scope);
      }
      const baseModelRef = model.baseModel
        ? code`: ${this.emitter.emitTypeReference(model.baseModel, this.emitter.getContext())}`
        : "";
      const baseClass = baseModelRef || (isErrorType ? ": HttpServiceException" : "");

      const namespace = this.emitter.getContext().namespace;
      const className = ensureCSharpIdentifier(this.emitter.getProgram(), model, name);
      const doc = getDoc(this.emitter.getProgram(), model);
      const attributes = getModelAttributes(this.emitter.getProgram(), model, className);
      const exceptionConstructor = isErrorType
        ? this.getModelExceptionConstructor(this.emitter.getProgram(), model, name, className)
        : "";

      this.#metadateMap.set(model, new CSharpType({ name: className, namespace: namespace }));
      const decl = this.emitter.result.declaration(
        className,
        code`
      namespace ${namespace} {

      ${doc ? `${formatComment(doc)}\n` : ""}${`${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}${attributes?.length > 0 ? "\n" : ""}`}public partial class ${className} ${baseClass} {
      ${exceptionConstructor ? `${exceptionConstructor}\n` : ""}${this.emitter.emitModelProperties(model)}
    }
   } `,
      );

      return decl;
    }

    getModelExceptionConstructor(
      program: Program,
      model: Model,
      modelName: string,
      className: string,
    ): string | undefined {
      if (!isErrorModel(program, model)) return undefined;
      const constructor = this.getExceptionConstructorData(program, model, modelName);
      const isParent = !!model.derivedModels?.length;
      return `public ${className}(${constructor.properties}) : base(${constructor.statusCode?.value ?? `400`}${constructor.header ? `, \n\t\t headers: new(){${constructor.header}}` : ""}${constructor.value ? `, \n\t\t value: new{${constructor.value}}` : ""}) 
        { ${constructor.body ? `\n${constructor.body}` : ""}\n\t}${isParent ? `\npublic ${className}(int statusCode, object? value = null, Dictionary<string, string>? headers = default): base(statusCode, value, headers) {}\n` : ""}`;
    }

    isDuplicateExceptionName(name: string): boolean {
      const exceptionPropertyNames: string[] = [
        "value",
        "headers",
        "stacktrace",
        "source",
        "message",
        "innerexception",
        "hresult",
        "data",
        "targetsite",
        "helplink",
      ];
      return exceptionPropertyNames.includes(name.toLowerCase());
    }

    getExceptionConstructorData(program: Program, model: Model, modelName: string) {
      const allProperties = new ModelInfo().getAllProperties(program, model) ?? [];
      const propertiesWithDefaults = allProperties.map((prop) => {
        const { defaultValue: typeDefault } = this.#findPropertyType(prop);
        const defaultValue = prop.defaultValue
          ? code`${JSON.stringify(serializeValueAsJson(program, prop.defaultValue, prop))}`
          : typeDefault;
        return { prop, defaultValue };
      });

      const sortedProperties = propertiesWithDefaults
        .filter(({ prop }) => !isStatusCode(program, prop))
        .sort(({ prop: a, defaultValue: aDefault }, { prop: b, defaultValue: bDefault }) => {
          if (!a.optional && !aDefault && (b.optional || bDefault)) return -1;
          if (!b.optional && !bDefault && (a.optional || aDefault)) return 1;
          return 0;
        });

      const properties: string[] = [];
      const body: string[] = [];
      const header: string[] = [];
      const value: string[] = [];

      const statusCode = getStatusCode(program, model);
      if (statusCode?.requiresConstructorArgument) {
        properties.push(`int ${statusCode.value}`);
      }

      for (const { prop, defaultValue } of sortedProperties) {
        let propertyName = ensureCSharpIdentifier(program, prop, prop.name);
        if (modelName === propertyName || this.isDuplicateExceptionName(propertyName)) {
          propertyName = `${propertyName}Prop`;
        }

        const type = getCSharpType(program, prop.type);
        properties.push(
          `${type?.type.name} ${prop.name}${defaultValue ? ` = ${defaultValue}` : `${prop.optional ? " = default" : ""}`}`,
        );
        body.push(`\t\t${propertyName} = ${prop.name};`);

        if (isHeader(program, prop)) {
          const headerName = getHeaderFieldName(program, prop);
          header.push(`{"${headerName}", ${prop.name}}`);
        } else {
          value.push(`${prop.name} = ${prop.name}`);
        }
      }

      return {
        properties: properties.join(", "),
        body: body.join("\n"),
        header: header.join(", "),
        value: value.join(","),
        statusCode: statusCode,
      };
    }

    modelDeclarationContext(model: Model, name: string): Context {
      function getSourceModels(source: Model, visited: Set<Model> = new Set<Model>()): Model[] {
        const result: Model[] = [];
        if (visited.has(source)) return [];
        result.push(source);
        visited.add(source);
        for (const candidate of source.sourceModels) {
          result.push(...getSourceModels(candidate.model, visited));
        }
        return result;
      }
      function getModelNamespace(model: Model): Namespace | undefined {
        const sourceModels = getSourceModels(model);
        if (sourceModels.length === 0) return undefined;
        return sourceModels
          .filter((m) => m.namespace !== undefined)
          .flatMap((s) => s.namespace)
          .reduce((c, n) => (c === n ? c : undefined));
      }
      if (this.#isMultipartModel(model)) return this.emitter.getContext();
      const modelName = ensureCSharpIdentifier(this.emitter.getProgram(), model, name);
      const modelFile = this.emitter.createSourceFile(`generated/models/${modelName}.cs`);
      modelFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const ns = model.namespace ?? getModelNamespace(model);
      const modelNamespace = this.#getOrAddNamespace(ns);
      return this.#createModelContext(modelNamespace, modelFile, modelName);
    }

    modelInstantiationContext(model: Model): Context {
      if (this.#isMultipartModel(model)) return this.emitter.getContext();
      const modelName: string = getModelInstantiationName(
        this.emitter.getProgram(),
        model,
        model.name,
      );
      const sourceFile = this.emitter.createSourceFile(`generated/models/${modelName}.cs`);
      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
      const modelNamespace = this.#getOrAddNamespace(model.namespace);
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
        const valueType = this.#getSimpleType(recordType);
        return code`Dictionary<string, ${valueType ? valueType?.getTypeReference() : this.emitter.emitTypeReference(recordType)}>`;
      }

      const context = this.emitter.getContext();
      const className = context.instantiationName ?? name;
      return this.modelDeclaration(model, className);
    }

    #getSimpleType(type: Type): CSharpType | undefined {
      switch (type.kind) {
        case "Model":
          if (!isRecord(type)) return undefined;
          return getCSharpType(this.emitter.getProgram(), type)?.type;
        case "Boolean":
        case "Intrinsic":
        case "ModelProperty":
        case "Number":
        case "Scalar":
        case "String":
        case "StringTemplate":
        case "StringTemplateSpan":
        case "Tuple":
          return getCSharpType(this.emitter.getProgram(), type)?.type;
        default:
          return undefined;
      }
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
      let propertyName = ensureCSharpIdentifier(this.emitter.getProgram(), property, property.name);

      const {
        typeReference: typeName,
        defaultValue: typeDefault,
        nullableType: nullable,
      } = this.#findPropertyType(property);
      const doc = getDoc(this.emitter.getProgram(), property);
      const attributes = new Map<string, Attribute>(
        getModelAttributes(this.emitter.getProgram(), property, propertyName).map((a) => [
          a.type.name,
          a,
        ]),
      );
      const modelName: string | undefined = this.emitter.getContext()["name"];
      if (
        modelName === propertyName ||
        (this.isDuplicateExceptionName(propertyName) &&
          property.model &&
          isErrorModel(this.emitter.getProgram(), property.model))
      ) {
        propertyName = `${propertyName}Prop`;
        const attr = getEncodedNameAttribute(this.emitter.getProgram(), property, propertyName)!;
        if (!attributes.has(attr.type.name)) attributes.set(attr.type.name, attr);
      }
      const defaultValue =
        this.#opHelpers.getDefaultValue(
          this.emitter.getProgram(),
          property.type,
          property.defaultValue,
        ) ?? typeDefault;
      const attributeList = [...attributes.values()];
      return this.emitter.result
        .rawCode(code`${doc ? `${formatComment(doc)}\n` : ""}${`${attributeList.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}${attributeList?.length > 0 ? "\n" : ""}`}public ${this.#isInheritedProperty(property) ? "new " : ""}${typeName}${
        isValueType(this.emitter.getProgram(), property.type) && (property.optional || nullable)
          ? "?"
          : ""
      } ${propertyName} { get; ${typeDefault ? "}" : "set; }"}${
        defaultValue ? ` = ${defaultValue};\n` : "\n"
      }
    `);
    }

    #findPropertyType(property: ModelProperty): EmittedTypeInfo {
      return this.#opHelpers.getTypeInfo(this.emitter.getProgram(), property.type, property);
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
        code`
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
      const sourceFile = this.emitter.createSourceFile(`generated/operations/${ifaceName}.cs`);
      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Interface;
      sourceFile.meta["nullable"] = true;
      const ifaceNamespace = this.#getOrAddNamespace(iface.namespace);
      sourceFile.imports.set("System", ["System"]);
      sourceFile.imports.set("System.Net", ["System.Net"]);
      sourceFile.imports.set("System.Text.Json", ["System.Text.Json"]);
      sourceFile.imports.set("System.Text.Json.Serialization", ["System.Text.Json.Serialization"]);
      sourceFile.imports.set("System.Threading.Tasks", ["System.Threading.Tasks"]);
      sourceFile.imports.set("Microsoft.AspNetCore.Mvc", ["Microsoft.AspNetCore.Mvc"]);
      if (this.#hasMultipartOperation(iface)) {
        sourceFile.imports.set("Microsoft.AspNetCore.WebUtilities", [
          "Microsoft.AspNetCore.WebUtilities",
        ]);
      }
      return this.#createModelContext(ifaceNamespace, sourceFile, ifaceName);
    }

    interfaceDeclarationOperations(iface: Interface): EmitterOutput<string> {
      // add in operations
      const builder: StringBuilder = new StringBuilder();
      const context = this.emitter.getContext();
      const name = `${ensureCSharpIdentifier(
        this.emitter.getProgram(),
        iface,
        iface.name,
        NameCasingType.Class,
      )}`;
      const ifaceNamespace = this.#getOrAddNamespace(iface.namespace);
      const namespace = ifaceNamespace;
      const mock: BusinessLogicImplementation = {
        className: name,
        interfaceName: `I${name}`,
        methods: [],
        namespace: namespace,
        usings: [],
      };
      for (const [name, operation] of iface.operations) {
        const doc = getDoc(this.emitter.getProgram(), operation);
        const returnTypes: Type[] = [];
        const [httpOp, _] = getHttpOperation(this.emitter.getProgram(), operation);
        for (const response of httpOp.responses.filter(
          (r) => !isErrorModel(this.emitter.getProgram(), r.type),
        )) {
          const [_, responseType] = this.#resolveOperationResponse(response, httpOp.operation);
          returnTypes.push(responseType);
        }
        const returnInfo = coalesceTypes(this.emitter.getProgram(), returnTypes, namespace);
        const returnType: CSharpType = returnInfo?.type || UnknownType;
        const opName = ensureCSharpIdentifier(
          this.emitter.getProgram(),
          operation,
          name,
          NameCasingType.Method,
        );
        const parameters = this.#opHelpers.getParameters(this.emitter.getProgram(), httpOp);

        const opImpl: BusinessLogicMethod = {
          methodName: `${opName}Async`,
          methodParams: `${getBusinessLogicDeclParameters(parameters)}`,
          returnType: returnType,
          returnTypeName: `${returnType.name === "void" ? "Task" : `Task<${returnType.getTypeReference(context.scope)}>`}`,
          instantiatedReturnType:
            returnType.name === "void"
              ? undefined
              : `${returnType.getTypeReference(context.scope)}`,
        };
        const opDecl: Declaration<string> = this.emitter.result.declaration(
          opName,
          code`${doc ? `${formatComment(doc)}\n` : ""}${opImpl.returnTypeName} ${opImpl.methodName}( ${opImpl.methodParams});`,
        );

        mock.methods.push(opImpl);
        builder.push(code`${opDecl.value}\n`);
        this.emitter.emitInterfaceOperation(operation);
      }
      mock.usings.push(...getImports(context.scope));
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
      const parameters = this.#opHelpers.getParameters(this.emitter.getProgram(), httpOperation);
      const declParams = getHttpDeclParameters(parameters);

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
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
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
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
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
      const parameters = this.#opHelpers.getParameters(this.emitter.getProgram(), httpOperation);
      const declParams = getHttpDeclParameters(parameters);
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
              ? `var result = await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
          return ${resultString}(result);`
              : `await ${this.emitter.getContext().resourceName}Impl.${operationName}Async(${getBusinessLogicCallParameters(parameters)});
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

    #resolveOperationResponse(
      response: HttpOperationResponse,
      operation: Operation,
    ): [CSharpType, Type] {
      function getName(sourceType: Model, part: string): string {
        return ensureCSharpIdentifier(emitter.getProgram(), sourceType, part, NameCasingType.Class);
      }
      let responseType = new HttpMetadata().resolveLogicalResponseType(
        this.emitter.getProgram(),
        response,
      );

      if (responseType.kind === "Model" && !responseType.name) {
        const modelName = `${getName(responseType, operation.interface!.name)}${getName(responseType, operation.name)}Response}`;
        const returnedType = this.emitter
          .getProgram()
          .checker.cloneType(responseType, { name: modelName });
        responseType = returnedType;
      }
      this.emitter.emitType(responseType);

      const context = this.emitter.getContext();
      const result = getCSharpType(this.emitter.getProgram(), responseType, context.namespace);
      return [result?.type || UnknownType, responseType];
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
      function isValid(program: Program, response: HttpOperationResponse) {
        return (
          !isErrorModel(program, response.type) &&
          getCSharpStatusCode(response.statusCodes) !== undefined
        );
      }
      const builder: StringBuilder = new StringBuilder();
      for (const response of operation.responses) {
        const [responseType, _] = this.#resolveOperationResponse(response, operation.operation);
        if (isValid(this.emitter.getProgram(), response)) {
          builder.push(
            code`${builder.segments.length > 0 ? "\n" : ""}${this.#emitOperationResponseDecorator(response, responseType)}`,
          );
        }
      }

      return builder.reduce();
    }

    #emitOperationResponseDecorator(response: HttpOperationResponse, result: CSharpType) {
      return this.emitter.result.rawCode(
        code`[ProducesResponseType((int)${getCSharpStatusCode(
          response.statusCodes,
        )!}, Type = typeof(${this.#emitResponseType(result)}))]`,
      );
    }

    #emitResponseType(type: CSharpType) {
      const context = this.emitter.getContext();
      return type.getTypeReference(context.scope);
    }

    unionDeclaration(union: Union, name: string): EmitterOutput<string> {
      const baseType = coalesceUnionTypes(this.emitter.getProgram(), union);
      if (isStringEnumType(this.emitter.getProgram(), union)) {
        const program = this.emitter.getProgram();
        const unionName = ensureCSharpIdentifier(program, union, name);
        const namespace = this.emitter.getContext().namespace;
        const doc = getDoc(this.emitter.getProgram(), union);
        const attributes = getModelAttributes(program, union, unionName);
        this.#metadateMap.set(union, new CSharpType({ name: unionName, namespace: namespace }));
        return this.emitter.result.declaration(
          unionName,
          code`
        namespace ${namespace}
        {

            ${doc ? `${formatComment(doc)}` : ""}
            ${attributes.map((attribute) => attribute.getApplicationString(this.emitter.getContext().scope)).join("\n")}
            public enum ${unionName}
            {
              ${this.emitter.emitUnionVariants(union)}
            }
        } `,
        );
      }

      return this.emitter.result.rawCode(
        code`${baseType.getTypeReference(this.emitter.getContext().scope)}`,
      );
    }

    unionDeclarationContext(union: Union): Context {
      if (isStringEnumType(this.emitter.getProgram(), union)) {
        const unionName = ensureCSharpIdentifier(
          this.emitter.getProgram(),
          union,
          union.name || "Union",
        );

        const unionFile = this.emitter.createSourceFile(`generated/models/${unionName}.cs`);

        unionFile.meta[this.#sourceTypeKey] = CSharpSourceType.Model;
        const unionNamespace = this.#getOrAddNamespace(union.namespace);
        return this.#createEnumContext(unionNamespace, unionFile, unionName);
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
            code`
            [JsonStringEnumMemberName("${variant.type.value}")]
            ${ensureCSharpIdentifier(this.emitter.getProgram(), variant, nameHint, NameCasingType.Property)}`,
          );
          if (i < union.variants.size) result.pushLiteralSegment(", ");
        }
      }

      return this.emitter.result.rawCode(result.reduce());
    }

    unionVariantContext(union: Union): Context {
      return super.unionVariantContext(union);
    }

    #createModelContext(namespace: string, file: SourceFile<string>, name: string): Context {
      file.imports.set("System", ["System"]);
      file.imports.set("System.Text.Json", ["System.Text.Json"]);
      file.imports.set("System.Text.Json.Serialization", ["System.Text.Json.Serialization"]);
      file.imports.set("TypeSpec.Helpers.JsonConverters", ["TypeSpec.Helpers.JsonConverters"]);
      file.imports.set("TypeSpec.Helpers", ["TypeSpec.Helpers"]);
      file.meta[this.#nsKey] = namespace;
      const context = {
        namespace: namespace,
        name: name,
        file: file,
        scope: file.globalScope,
      };

      return context;
    }

    #createEnumContext(namespace: string, file: SourceFile<string>, name: string): Context {
      file.imports.set("System.Text.Json", ["System.Text.Json"]);
      file.imports.set("System.Text.Json.Serialization", ["System.Text.Json.Serialization"]);

      return {
        namespace: namespace,
        name: name,
        file: file,
        scope: file.globalScope,
      };
    }

    #createOrGetResourceContext(
      name: string,
      operation: Operation,
      resource?: Model,
    ): ControllerContext {
      name = ensureCSharpIdentifier(
        this.emitter.getProgram(),
        operation,
        name,
        NameCasingType.Class,
      );
      const namespace = this.#getOrAddNamespace(operation.namespace);
      let context: ControllerContext | undefined = controllers.get(`${namespace}.${name}`);
      if (context !== undefined) return context;
      const sourceFile: SourceFile<string> = this.emitter.createSourceFile(
        `generated/controllers/${name}Controller.cs`,
      );

      sourceFile.meta[this.#sourceTypeKey] = CSharpSourceType.Controller;
      sourceFile.meta["resourceName"] = name;
      sourceFile.meta["resource"] = `${name}Controller`;
      sourceFile.meta["namespace"] = namespace;
      sourceFile.imports.set("System", ["System"]);
      sourceFile.imports.set("System.Net", ["System.Net"]);
      sourceFile.imports.set("System.Threading.Tasks", ["System.Threading.Tasks"]);
      sourceFile.imports.set("System.Text.Json", ["System.Text.Json"]);
      sourceFile.imports.set("System.Text.Json.Serialization", ["System.Text.Json.Serialization"]);
      sourceFile.imports.set("Microsoft.AspNetCore.Mvc", ["Microsoft.AspNetCore.Mvc"]);
      sourceFile.imports.set(namespace, [namespace]);
      sourceFile.meta[this.#nsKey] = namespace;
      context = {
        namespace: namespace,
        file: sourceFile,
        resourceName: name,
        scope: sourceFile.globalScope,
        resourceType: resource,
      };
      controllers.set(`${namespace}.${name}`, context);
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
      const resolved = resolveReferenceFromScopes(targetDeclaration, pathDown, pathUp);
      return resolved ?? super.reference(targetDeclaration, pathUp, pathDown, commonScope);
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
      if (sourceFile.meta.emitted) {
        return sourceFile.meta.emitted;
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
      contents.pushLiteralSegment(`${file.meta["nullable"] ? this.#generatedFileHeaderWithNullable : this.#generatedFileHeader}
        
        ${this.#emitUsings(file)}
        `);
      for (const decl of file.globalScope.declarations) {
        contents.push(decl.value);
      }
      for (const child of file.globalScope.childScopes) {
        if (child.declarations) {
          for (const decl of child.declarations) {
            contents.push(decl.value);
          }
        }
      }

      return contents.segments.join("\n") + "\n";
    }

    #emitControllerContents(file: SourceFile<string>): string {
      const namespace = file.meta.namespace;
      const contents: StringBuilder = new StringBuilder();
      contents.push(`${this.#generatedFileHeaderWithNullable}\n\n`);
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

    async writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
      sourceFiles.push(...getSerializationSourceFiles(this.emitter).flatMap((l) => l.source));
      sourceFiles.push(
        ...getProjectDocs(this.emitter, this.#useSwagger, this.#mockRegistrations).flatMap(
          (l) => l.source,
        ),
      );

      if (this.#emitMocks === "mocks-and-project-files" || this.#emitMocks === "mocks-only") {
        if (this.#mockRegistrations.size > 0) {
          const mocks = getBusinessLogicImplementations(
            this.emitter,
            this.#mockRegistrations,
            this.#useSwagger,
            this.#openapiPath,
          );

          sourceFiles.push(...mocks.flatMap((l) => l.source));
        }
      }
      async function shouldWrite(source: SourceFile<string>, exists: FileExists): Promise<boolean> {
        return (
          !source.meta.conditional || options.overwrite === true || !(await exists(source.path))
        );
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
                  if (await shouldWrite(source, this.#fileExists)) {
                    emittedSourceFiles.push(source);
                  }
                  break;
              }
            }
            break;
          default:
            if (await shouldWrite(source, this.#fileExists)) {
              emittedSourceFiles.push(source);
            }
            break;
        }
      }
      return super.writeOutput(emittedSourceFiles);
    }
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
  const ns = context.program.getGlobalNamespaceType();
  const options = emitter.getOptions();

  processNameSpace(context.program, ns);
  if (!doNotEmit) {
    const outputDir = options.emitterOutputDir;
    const generatedDir = path.join(outputDir, "generated");
    await ensureCleanDirectory(context.program, generatedDir);

    function normalizeSlashes(path: string) {
      return path.replaceAll("\\", "/");
    }

    async function getOpenApiPath(): Promise<string> {
      if (options["openapi-path"]) return options["openapi-path"];
      const openApiSettings = await getOpenApiConfig(context.program);
      const projectDir = resolvePath(context.program.projectRoot, outputDir);
      if (openApiSettings.outputDir) {
        const openApiPath = resolvePath(
          openApiSettings.outputDir,
          openApiSettings.fileName || "openapi.yaml",
        );
        return normalizeSlashes(path.relative(projectDir, openApiPath));
      }
      if (openApiSettings.emitted) {
        const baseDir =
          context.program.compilerOptions.outputDir ||
          resolvePath(context.program.projectRoot, "tsp-output");
        const openApiPath = resolvePath(
          baseDir,
          "@typespec",
          "openapi3",
          openApiSettings.fileName || "openapi.yaml",
        );
        return normalizeSlashes(path.relative(projectDir, openApiPath));
      }
      return "";
    }
    const openApiPath = await getOpenApiPath();
    const UseSwaggerUI = openApiPath !== "" && options["use-swaggerui"] === true;
    let httpPort: number | undefined;
    let httpsPort: number | undefined;

    if (options["emit-mocks"] !== "none") {
      getScaffoldingHelpers(emitter, UseSwaggerUI, openApiPath, true);
    }
    if (options["emit-mocks"] === "mocks-and-project-files") {
      httpPort = options["http-port"] || (await getFreePort(5000, 5999));
      httpsPort = options["https-port"] || (await getFreePort(7000, 7999));

      getProjectHelpers(
        emitter,
        options["project-name"] || "ServiceProject",
        options["use-swaggerui"] || false,
        httpPort,
        httpsPort,
      );
    }

    await emitter.writeOutput();
    const projectDir = normalizeSlashes(path.relative(process.cwd(), resolvePath(outputDir)));
    function trace(message: string) {
      context.program.trace("http-server-csharp", `hscs-msg: ${message}`);
    }

    trace(`Your project was successfully created at "${projectDir}"`);
    trace(`You can build and start the project using 'dotnet run --project "${projectDir}"'`);
    if (options["use-swaggerui"] === true && httpsPort) {
      trace(
        `You can browse the swagger UI to test your service using 'start https://localhost:${httpsPort}/swagger/' `,
      );
    }

    if (options["skip-format"] === undefined || options["skip-format"] === false) {
      await execFile("dotnet", [
        "format",
        "whitespace",
        outputDir,
        "--include-generated",
        "--folder",
      ]);
    }
  }
}
